---
title: Aile v2 - Runtime
description: Construcción, arranque, apagado y configuración del servidor en Aile.
wiki_project: Aile
---

`aile.App` se puede usar de dos maneras: dejar que Aile abra el listener y
maneje las señales, o construir el handler y montarlo en un servidor propio. Las
dos comparten la misma configuración y el mismo middleware.

## Crear la aplicación

```go
app, err := aile.New()
if err != nil {
    log.Fatal(err)
}

// Para ejemplos y tests donde un error de configuración es un bug.
app := aile.MustNew()
```

`New` aplica las opciones y devuelve error si alguna falla. Las opciones que
vienen en el paquete no fallan nunca; `MustNew` existe para no arrastrar el
`if err != nil` en ejemplos.

### Opciones

| Opción                       | Para qué sirve                                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| `aile.WithAddr(":8080")`     | Cambia la dirección de escucha.                                                                      |
| `aile.WithConfig(cfg)`       | Reemplaza la configuración completa. Los ceros se rellenan con los valores por defecto al construir. |
| `aile.WithMiddleware(mw...)` | Agrega middleware durante la construcción.                                                           |

```go
app := aile.MustNew(
    aile.WithAddr(":8080"),
    aile.WithMiddleware(aile.Recovery()),
)
```

## Configuración del servidor

`aile.Config` controla los timeouts y el tamaño máximo de cabeceras. Los valores
por defecto salen de `DefaultConfig`:

| Campo               | Valor por defecto |
| ------------------- | ----------------- |
| `Addr`              | `:9001`           |
| `ReadTimeout`       | 5 s               |
| `ReadHeaderTimeout` | 5 s               |
| `WriteTimeout`      | 10 s              |
| `IdleTimeout`       | 60 s              |
| `ShutdownTimeout`   | 10 s              |
| `MaxHeaderBytes`    | 1 MiB             |

Los campos en cero se reemplazan por el valor por defecto durante `Build` o
`Run`. Si necesitas desactivar un timeout, no puedes hacerlo con `0`; usa un
valor negativo o construye el `http.Server` a mano a partir de `Build`.

```go
app := aile.MustNew(aile.WithConfig(aile.Config{
    Addr:            ":8080",
    ReadTimeout:     3 * time.Second,
    WriteTimeout:    15 * time.Second,
    ShutdownTimeout: 20 * time.Second,
}))
```

## Build

`Build` no abre puertos. Construye el `http.ServeMux`, envuelve el handler con
el middleware y devuelve un `*aile.State`:

```go
st, err := app.Build(context.Background())
if err != nil {
    log.Fatal(err)
}

fmt.Println(st.Config.Addr)
fmt.Println(st.Handler)
```

`State` expone:

| Campo     | Contenido                                                 |
| --------- | --------------------------------------------------------- |
| `Config`  | La configuración efectiva, ya con los defaults aplicados. |
| `Mux`     | El `*http.ServeMux` con las rutas registradas.            |
| `Handler` | El mux envuelto por todo el middleware.                   |
| `Server`  | El `*http.Server` configurado, todavía sin arrancar.      |
| `Values`  | Una copia de los valores puestos con `app.Set`.           |

`Build` acepta un `context.Context` por simetría con el resto del API, pero hoy
no lo usa. Sirve sobre todo para tests y para montar Aile dentro de otro
servidor.

## Arrancar

### Run

```go
if err := app.Run(context.Background()); err != nil {
    log.Fatal(err)
}
```

`Run` hace todo el trabajo:

1. Construye la aplicación.
2. Abre el listener en `Config.Addr`.
3. Ejecuta los hooks de inicio.
4. Sirve hasta que llega `SIGINT`, `SIGTERM` o se cancela el contexto padre.
5. Llama a `Shutdown` con `Config.ShutdownTimeout`.
6. Ejecuta los hooks de cierre.

### Serve

```go
ln, err := net.Listen("tcp", "127.0.0.1:0")
if err != nil {
    log.Fatal(err)
}

if err := app.Serve(ln); err != nil {
    log.Fatal(err)
}
```

`Serve` usa un listener que ya existe y no instala manejadores de señales. Es la
opción para tests de integración y para sistemas donde el apagado lo controla
otro proceso. El listener queda a cargo de quien lo creó, salvo que falle un
hook de inicio: en ese caso `Serve` lo cierra antes de devolver el error.

### ListenAndServe

```go
if err := app.ListenAndServe(); err != nil {
    log.Fatal(err)
}
```

Abre el listener en `Config.Addr` y llama a `Serve`. Tampoco maneja señales.

### Shutdown

```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

if err := app.Shutdown(ctx); err != nil {
    log.Fatal(err)
}
```

`Shutdown` delega en `http.Server.Shutdown`. Si la aplicación no está corriendo
devuelve `nil`. No cierra el proceso ni ejecuta los hooks de cierre: eso pasa
cuando `Run` o `Serve` vuelven.

### Addr

`Addr` devuelve la dirección real del listener mientras la aplicación corre. Si
no está corriendo devuelve una cadena vacía. Es útil cuando escuchas en `:0` y
necesitas saber qué puerto eligió el sistema.

## Hooks

```go
app.OnStart(func(ctx context.Context, st *aile.State) error {
    log.Println("arrancando en", st.Config.Addr)
    return nil
})

app.OnShutdown(func(ctx context.Context, st *aile.State) error {
    log.Println("cerrando")
    return nil
})
```

Los hooks se ejecutan en el orden en que se registran. Si un hook de inicio
devuelve error, `Run` y `Serve` cierran el listener y devuelven ese error; los
hooks de cierre no se ejecutan. Si un hook de cierre falla, el error se une al
error del servidor con `errors.Join`.

## Valores compartidos

```go
app.Set("version", "1.2.3")
app.Set("db", db)

value, ok := app.Value("db")
```

`Build` entrega una copia del mapa. Cambiar el mapa de la app después de
construir no cambia el `State` que ya está corriendo. Los valores son `any`, así
que el type assertion queda de tu lado.

## Un servidor completo

```go
func main() {
    app := aile.MustNew(
        aile.WithAddr(":8080"),
        aile.WithMiddleware(
            aile.Recovery(),
            requestid.Middleware(requestid.Config{}),
        ),
    )

    app.OnStart(func(ctx context.Context, st *aile.State) error {
        log.Println("escuchando en", st.Config.Addr)
        return nil
    })

    app.GET("/healthz", func(w http.ResponseWriter, r *http.Request) {
        aile.Text(w, http.StatusOK, "ok")
    })

    if err := app.Run(context.Background()); err != nil {
        log.Fatal(err)
    }
}
```

Para el orden exacto del middleware, revisa
[Middleware](/wiki/aile/middleware/#orden-de-ejecución).

## Errores comunes

### `Addr` devuelve vacío

`Addr` solo tiene valor mientras la aplicación está corriendo. Si lo llamas
antes de `Run` o `Serve`, devuelve una cadena vacía. Para saber el puerto antes
de arrancar, usa `st.Config.Addr`; para el puerto real de un `:0`, llama a
`Addr` después de que el listener esté abierto.

### No puedes desactivar un timeout con cero

`Build` rellena los campos en cero con `DefaultConfig`. Poner `ReadTimeout: 0`
no significa "sin timeout": significa "usa 5 segundos". Si necesitas
desactivarlo, construye el `http.Server` a mano desde `State` o usa un valor
negativo.

### Los hooks de cierre no corren si falla el inicio

Si un `OnStart` devuelve error, `Run` y `Serve` cierran el listener y salen sin
ejecutar los `OnShutdown`. No uses el hook de cierre para liberar recursos que
todavía no se abrieron; el orden es inicio, serve, cierre.

### `Shutdown` antes de `Serve` no hace nada

Si la app no está corriendo, `Shutdown` devuelve `nil` y no ejecuta hooks. No es
un error, pero tampoco es un apagado. Llama a `Shutdown` solo después de que el
listener esté activo.

### Cancelar el contexto solo funciona con `Run`

`Run` usa `signal.NotifyContext(ctx, ...)`, así que cancelar el contexto padre
dispara el apagado. `Serve` y `ListenAndServe` no miran el contexto; para
detenerlos, cierra el listener o llama a `Shutdown`.

### Los valores no se actualizan después de `Build`

`Build` clona el mapa de valores. Si haces `app.Set` después de construir, el
`State` que ya está corriendo no ve el cambio. Configura los valores antes de
`Build` o compártelos por otro medio.
