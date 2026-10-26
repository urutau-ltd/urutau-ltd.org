---
title: Aile v2 - Rutas
description: Patrones de ServeMux, helpers de método y pruebas de rutas en Aile.
wiki_project: Aile
---

Aile no tiene un parser de rutas propio. Registra cada handler en un
`http.ServeMux` usando el método HTTP como parte del patrón. Eso significa que
los comodines, la precedencia y los redirects son los de `net/http` desde Go
1.22.

## Helpers de método

```go
app.GET("/users", listUsers)
app.POST("/users", createUser)
app.PUT("/users/{id}", replaceUser)
app.PATCH("/users/{id}", updateUser)
app.DELETE("/users/{id}", deleteUser)
app.HEAD("/users/{id}", headUser)
app.OPTIONS("/users", optionsUser)
```

La firma es la misma en todos los casos:

```go
func (a *App) GET(pattern string, h http.HandlerFunc)
```

`GET` también atiende `HEAD` cuando no registras un `HEAD` explícito, igual que
en `http.ServeMux`. Si necesitas un comportamiento distinto para `HEAD`,
regístralo por separado.

## Patrones y parámetros

Los patrones aceptan las mismas formas que `ServeMux`:

```go
app.GET("/api/v1/health", health)
app.GET("/users/{id}", showUser)
app.GET("/files/{path...}", serveFile)
```

Para leer los valores usa `r.PathValue`:

```go
app.GET("/users/{id}", func(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    aile.Text(w, http.StatusOK, "usuario "+id)
})

app.GET("/files/{path...}", func(w http.ResponseWriter, r *http.Request) {
    file := r.PathValue("path")
    aile.Text(w, http.StatusOK, "archivo "+file)
})
```

La precedencia también es la de `ServeMux`: el patrón más específico gana. Si
registras `/users/me` y `/users/{id}`, una petición a `/users/me` entra por el
primero.

```go
app.GET("/users/me", currentUser)
app.GET("/users/{id}", showUser)
```

Un patrón terminado en `{$}` coincide solo con la ruta exacta. Un patrón que
termina en `/` funciona como subárbol. Estas reglas no las cambia Aile.

## Registro y errores

El orden de registro no importa para el matching, pero sí para detectar
duplicados. `Build` valida que el método, la ruta y el handler no estén vacíos.
Un patrón inválido o un conflicto entre patrones hace que `http.ServeMux` entre
en pánico durante `Build`; no hay una capa que convierta ese pánico en error.

Tampoco hay una API para un 404 personalizado. Si lo necesitas, registra un
catch-all o envuelve el handler que devuelve `Build`. Ten en cuenta que un
catch-all `GET /` solo cubre `GET` y `HEAD`.

## Rutas agrupadas sin grupos

Aile no tiene `Group`, así que la forma de agrupar es una función que recibe la
app:

```go
func registerUsers(app *aile.App, h *UserHandler) {
    app.GET("/users", h.List)
    app.POST("/users", h.Create)
    app.GET("/users/{id}", h.Show)
    app.PATCH("/users/{id}", h.Update)
    app.DELETE("/users/{id}", h.Delete)
}
```

Si el grupo es un CRUD con la forma list/editor, `x/resource` evita repetir las
siete rutas. Está documentado en [Recursos](/wiki/aile/resource/).

## Archivos estáticos

`app.Static` registra la ruta y el redirect desde el prefijo sin barra final:

```go
//go:embed public/*
var public embed.FS

assets, err := fs.Sub(public, "public")
if err != nil {
    log.Fatal(err)
}

if err := app.Static("/assets", assets); err != nil {
    log.Fatal(err)
}
```

El prefijo debe empezar con `/`. Si pasas `/assets` sin barra final, Aile
registra `GET /assets` como redirect permanente hacia `/assets/`. El handler
real sirve el subárbol. Para usar el handler fuera de `App`, existe
`aile.StaticHandler`; los detalles están en
[Respuestas](/wiki/aile/respuestas/#archivos-estáticos).

## Probar una ruta sin abrir un puerto

`Build` devuelve un `*aile.State` con el `http.Handler` ya envuelto por el
middleware. Eso alcanza para usar `httptest`:

```go
func TestShowUser(t *testing.T) {
    app := aile.MustNew()
    app.GET("/users/{id}", func(w http.ResponseWriter, r *http.Request) {
        aile.Text(w, http.StatusOK, "usuario "+r.PathValue("id"))
    })

    st, err := app.Build(context.Background())
    if err != nil {
        t.Fatal(err)
    }

    req := httptest.NewRequest(http.MethodGet, "/users/42", nil)
    rec := httptest.NewRecorder()
    st.Handler.ServeHTTP(rec, req)

    if rec.Code != http.StatusOK {
        t.Fatalf("status = %d", rec.Code)
    }
    if got := rec.Body.String(); got != "usuario 42" {
        t.Fatalf("body = %q", got)
    }
}
```

Para una petición con body, usa un `strings.NewReader`:

```go
body := strings.NewReader(`{"title":"Hola"}`)
req := httptest.NewRequest(http.MethodPost, "/articles", body)
req.Header.Set("Content-Type", "application/json")
```

Y para `DELETE`, el patrón es el mismo; solo cambia el método y el handler no
escribe body:

```go
app.DELETE("/articles/{id}", func(w http.ResponseWriter, r *http.Request) {
    aile.Status(w, http.StatusNoContent)
})

req := httptest.NewRequest(http.MethodDelete, "/articles/1", nil)
rec := httptest.NewRecorder()
st.Handler.ServeHTTP(rec, req)
```

## Slash final

`ServeMux` limpia la ruta y hace sus propios redirects. Si quieres una política
uniforme, `x/trailing_slash` ofrece `RedirectTrim` y `RedirectAppend` con
redirects 308. No es obligatorio y no viene montado por defecto. Lo tienes en
[Middleware](/wiki/aile/middleware/#slash-final).

## Errores comunes

### El patrón duplicado entra en pánico

`http.ServeMux` no permite dos patrones que se pisen. Si registras dos veces
`GET /users/{id}`, la segunda llamada a `Handle` entra en pánico durante
`Build`. Aile no lo convierte en error de retorno; revisa el stack trace y busca
el registro repetido.

### El handler nulo falla en Build

```go
app.GET("/users", nil)
```

`Build` devuelve `build: nil handler for route "GET /users"` antes de arrancar.
Es mejor que un pánico en la primera petición, pero solo lo ves si compruebas el
error de `Build`.

### 405 no es 404

Si registras `GET /users/{id}` y llega un `POST`, `ServeMux` responde
`405
Method Not Allowed`, no `404`. Si ves un 405 en las pruebas, revisa el
método antes que la ruta.

### El path value llega vacío

`r.PathValue("id")` solo tiene valor si el patrón que atendió la petición tenía
`{id}`. Si un catch-all `GET /` atiende la ruta, el valor está vacío. Revisa la
precedencia de patrones.

### El slash final redirige

`ServeMux` limpia la ruta y puede redirigir `/users/` a `/users` o al revés,
según el patrón registrado. Si necesitas una política uniforme, usa
`x/trailing_slash` o registra explícitamente las dos formas. No mezcles las dos
soluciones sin saber cuál corre primero.

### `Static` rechaza el prefijo

```go
app.Static("assets", fsys) // error: prefix must start with "/"
```

El prefijo tiene que empezar con `/`. Si pasas `/assets` sin barra final, Aile
registra el redirect a `/assets/`; si pasas `/assets/`, no hay redirect.
