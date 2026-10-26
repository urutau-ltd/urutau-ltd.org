---
title: Aile v2 - Middleware
description: Orden de ejecución y paquetes de middleware incluidos en Aile.
wiki_project: Aile
---

Un middleware en Aile tiene la forma estándar de `net/http`:

```go
type Middleware func(http.Handler) http.Handler
```

Se registra con `app.Use` y se aplica a todas las rutas de la aplicación. No hay
middleware por grupo ni por ruta; si necesitas eso, envuelve el handler en el
momento de registrarlo.

## Orden de ejecución

```go
app.Use(logger.Middleware(slog.Default()))
app.Use(aile.Recovery())
```

El primer middleware registrado es el más externo. En una petición, el orden es
`logger -> Recovery -> handler`; en la respuesta, al revés. Si pones `Recovery`
antes que `logger`, un pánico en el logger también queda atrapado.

`x/combine` sirve para escribir ese stack en una sola llamada:

```go
app.Use(combine.Middleware(
    logger.Middleware(slog.Default()),
    aile.Recovery(),
))
```

El orden de los argumentos es el mismo que el de llamadas separadas a `Use`.

## Recovery

```go
app.Use(aile.Recovery())
```

Convierte un pánico en un `500` con el texto estándar de `http.StatusText`. Es
una red de seguridad, no un sistema de errores: si el handler ya escribió parte
de la respuesta, el `500` puede quedar mezclado con esos bytes.

## Paquetes incluidos

| Paquete            | Qué hace                                                 |
| ------------------ | -------------------------------------------------------- |
| `x/basic_auth`     | Autenticación HTTP Basic con un validador propio.        |
| `x/bearer_auth`    | Autenticación con token `Bearer`.                        |
| `x/combine`        | Compone varios middleware en uno.                        |
| `x/compress`       | Compresión gzip opcional.                                |
| `x/cors`           | Cabeceras CORS y preflight.                              |
| `x/health`         | Registra `GET /healthz`. No es middleware.               |
| `x/htmx`           | Lee y escribe cabeceras de HTMX. Tiene su propia página. |
| `x/ip_restriction` | Permite o niega por IP o red.                            |
| `x/logger`         | Log de peticiones con `log/slog`.                        |
| `x/request_id`     | Genera o propaga un request ID.                          |
| `x/resource`       | Monta rutas CRUD. Tiene su propia página.                |
| `x/secure_headers` | Cabeceras de seguridad.                                  |
| `x/trailing_slash` | Normaliza el slash final con redirects 308.              |

## Autenticación

### Basic

```go
app.Use(basicauth.Middleware("admin", func(user, pass string) bool {
    userOK := subtle.ConstantTimeCompare([]byte(user), []byte("admin")) == 1
    passOK := subtle.ConstantTimeCompare([]byte(pass), []byte("secreto")) == 1
    return userOK && passOK
}))
```

El primer argumento es el realm que aparece en `WWW-Authenticate`. Si lo dejas
vacío, se usa `restricted`. Un validador `nil` rechaza todas las peticiones.

### Bearer

```go
app.Use(bearerauth.Middleware(func(token string) bool {
    return subtle.ConstantTimeCompare([]byte(token), []byte("token-largo")) == 1
}))
```

El paquete busca `Authorization: Bearer <token>`. No valida el formato del token
más allá del prefijo; la comparación y las reglas quedan en el validador.

## CORS

```go
app.Use(cors.Middleware(cors.Config{
    AllowOrigins:     []string{"https://app.example.com"},
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
    AllowHeaders:     []string{"Content-Type", "Authorization"},
    ExposeHeaders:    []string{"X-Request-ID"},
    AllowCredentials: true,
    MaxAge:           600,
}))
```

Si `AllowOrigins` queda vacío, el paquete usa `*`. Si usas `AllowCredentials`,
no dejes `*` en los orígenes: el navegador rechaza esa combinación. El
middleware responde los preflight `OPTIONS` con `204` y no llama al handler.

## Compresión

```go
app.Use(compress.Middleware(compress.Config{
    Level:   gzip.DefaultCompression,
    MinSize: 512,
}))
```

Solo comprime si el cliente envía `Accept-Encoding: gzip`. `MinSize` es el
umbral en bytes; si la respuesta es más chica, se envía sin comprimir.
`Level: 0` usa `gzip.DefaultCompression`. El middleware borra `Content-Length` y
agrega `Vary: Accept-Encoding` cuando comprime.

## IP y redes

```go
app.Use(iprestriction.Middleware(iprestriction.Config{
    Allow: []*net.IPNet{
        mustCIDR("127.0.0.0/8"),
        mustCIDR("10.0.0.0/8"),
    },
    Deny:       []*net.IPNet{mustCIDR("10.1.2.0/24")},
    TrustProxy: false,
}))
```

`Deny` se evalúa antes que `Allow`. Si `Allow` está vacío, se permite cualquier
IP que no esté en `Deny`. Con `TrustProxy: true` el paquete lee el primer valor
de `X-Forwarded-For` y, si no hay, `X-Real-IP`. No actives `TrustProxy` si el
servidor no está detrás de un proxy que limpie esas cabeceras.

## Request ID

```go
app.Use(requestid.Middleware(requestid.Config{
    Header: "X-Request-ID",
}))

app.GET("/", func(w http.ResponseWriter, r *http.Request) {
    id, _ := requestid.FromContext(r.Context())
    aile.Text(w, http.StatusOK, id)
})
```

Si la petición ya trae la cabecera, se reutiliza. Si no, se genera un valor de
16 bytes en hexadecimal. Puedes reemplazar el generador con
`Config.Generator func() string`. El ID se guarda en el contexto y se devuelve
en la misma cabecera.

## Cabeceras de seguridad

```go
app.Use(secureheaders.Middleware(secureheaders.Config{
    ContentTypeNosniff:      true,
    FrameDeny:               true,
    ReferrerPolicy:          "strict-origin-when-cross-origin",
    ContentSecurityPolicy:   "default-src 'self'",
    PermissionsPolicy:       "camera=(), microphone=()",
    CrossOriginOpenerPolicy: "same-origin",
    HSTSMaxAge:              31536000,
    HSTSIncludeSubdomains:   true,
}))
```

`Strict-Transport-Security` solo se agrega cuando `r.TLS != nil`. Si terminas
TLS en un proxy y el backend habla HTTP, este middleware no va a emitir HSTS;
configúralo en el proxy o en el servidor que termina TLS.

## Slash final

```go
app.Use(trailingslash.Middleware(trailingslash.RedirectTrim))
```

`RedirectTrim` manda `/ruta/` a `/ruta`. `RedirectAppend` hace lo contrario.
Ambos usan `308 Permanent Redirect`, que conserva el método y el body. La raíz
`/` no se toca.

## Logger

```go
app.Use(logger.Middleware(slog.Default()))
```

Registra método, path, status, bytes, duración y `remote_addr` en cada petición.
El status por defecto es 200 si el handler no llama a `WriteHeader`. Si pasas
`nil`, usa `slog.Default()`.

## Health

```go
health.Mount(app)
```

No es middleware: registra `GET /healthz` y responde `ok`. Está documentado en
[Respuestas](/wiki/aile/respuestas/#health-check).

## Errores comunes

### El orden del middleware no es el que esperabas

El primer `Use` es el más externo. Si `Recovery` queda después de un middleware
que entra en pánico, el pánico no se atrapa. Escribe el stack de más externo a
más interno y prueba con un handler que haga `panic`.

### HSTS no aparece detrás de un proxy

`secure_headers` solo agrega `Strict-Transport-Security` si `r.TLS != nil`. Si
terminas TLS en Nginx, Caddy o un balanceador y el backend habla HTTP, el
middleware no emite HSTS. Configúralo en el proxy o en el servidor que termina
TLS.

### CORS con credenciales y `*`

Si `AllowOrigins` queda vacío, el paquete usa `*`. Si además pones
`AllowCredentials: true`, el navegador rechaza la combinación. Pon orígenes
explícitos cuando necesites credenciales.

### `TrustProxy` confía en cualquiera

`ip_restriction` con `TrustProxy: true` lee `X-Forwarded-For` y `X-Real-IP`. Si
el servidor no está detrás de un proxy que limpie esas cabeceras, cualquier
cliente puede falsificar su IP. Actívalo solo cuando el proxy sea de confianza.

### Un validador `nil` rechaza todo

En `basic_auth` y `bearer_auth`, un validador `nil` no significa "sin
autenticación": significa "rechaza todo". Para dejar pasar sin validar, no
montes el middleware.

### `compress` no comprime respuestas chicas

Si `MinSize` es 512 y la respuesta pesa 100 bytes, se envía sin comprimir. Es
deliberado: comprimir respuestas chicas agrega overhead y no ahorra mucho. Si
quieres comprimir todo, usa `MinSize: 0`.
