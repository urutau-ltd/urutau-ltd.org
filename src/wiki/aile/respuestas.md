---
title: Aile v2 - Respuestas
description: Helpers para texto, JSON, errores y archivos estáticos.
wiki_project: Aile
---

Aile incluye cuatro helpers de respuesta y dos para JSON. Son funciones sueltas,
no métodos de un contexto, así que puedes usarlas dentro de cualquier
`http.HandlerFunc`.

## Texto y estado

```go
app.GET("/ping", func(w http.ResponseWriter, r *http.Request) {
    aile.Text(w, http.StatusOK, "ok")
})

app.DELETE("/sessions/{id}", func(w http.ResponseWriter, r *http.Request) {
    aile.Status(w, http.StatusNoContent)
})
```

`Text` fija `Content-Type: text/plain; charset=utf-8`, escribe el status y luego
el body. `Status` solo escribe el status, sin body.

Para un error:

```go
app.GET("/private", func(w http.ResponseWriter, r *http.Request) {
    aile.Error(w, http.StatusForbidden, "no pasas")
})
```

`Error` delega en `http.Error`. Eso significa que el content type es
`text/plain; charset=utf-8`, que agrega un salto de línea al final y que el body
se escapa como texto. Si necesitas un error JSON, escribe el JSON a mano.

## JSON

```go
type Article struct {
    ID    string `json:"id"`
    Title string `json:"title"`
}

app.GET("/articles/{id}", func(w http.ResponseWriter, r *http.Request) {
    article := Article{ID: r.PathValue("id"), Title: "Hola"}
    if err := aile.WriteJSON(w, http.StatusOK, article); err != nil {
        log.Println("write json:", err)
    }
})
```

`WriteJSON` fija `Content-Type: application/json; charset=utf-8`, escribe el
status y codifica el valor con `json.NewEncoder`. El encoder agrega un salto de
línea al final.

Para leer un body:

```go
app.POST("/articles", func(w http.ResponseWriter, r *http.Request) {
    article, err := aile.DecodeJSON[Article](r)
    if err != nil {
        aile.Error(w, http.StatusBadRequest, "json inválido")
        return
    }

    if err := aile.WriteJSON(w, http.StatusCreated, article); err != nil {
        log.Println("write json:", err)
    }
})
```

`DecodeJSON` decodifica un solo valor y no limita el tamaño del body. Si el
endpoint es público, envuelve `r.Body` con `http.MaxBytesReader` antes de
llamarlo. Tampoco rechaza campos desconocidos; para eso tendrías que usar el
decoder de `encoding/json` directamente.

Un detalle importante: `WriteJSON` devuelve error si la codificación falla, pero
para entonces los headers y parte del body ya pueden haberse escrito. Si el
payload es grande o puede fallar, serialízalo antes con `json.Marshal` y escribe
los bytes con `w.Write`.

## Archivos estáticos

La forma corta es `app.Static`:

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

`Static` registra un `GET` de subárbol y, si el prefijo no termina en `/`,
también un redirect permanente desde `/assets` hacia `/assets/`. El prefijo debe
empezar con `/`; el prefijo `/` sirve la raíz del `fs.FS`.

Si solo quieres el handler:

```go
h, err := aile.StaticHandler("/assets/", assets)
if err != nil {
    log.Fatal(err)
}

http.Handle("/assets/", h)
```

`StaticHandler` es un wrapper de `http.StripPrefix` y `http.FileServerFS`. No
agrega cache headers, compresión ni listados personalizados. Si necesitas eso,
monta tu propio handler con `http.FileServerFS` o ponlo detrás de un middleware.

## Health check

`x/health` registra un endpoint mínimo:

```go
import "codeberg.org/urutau-ltd/aile/v2/x/health"

health.Mount(app)
```

Queda en `GET /healthz` y responde `ok` con status 200. No consulta la base de
datos ni otros servicios; si quieres un health check profundo, escribe el
handler tú.

## Tabla rápida

| Helper            | Content-Type                      | Body                                     |
| ----------------- | --------------------------------- | ---------------------------------------- |
| `aile.Text`       | `text/plain; charset=utf-8`       | El string que pasas.                     |
| `aile.Status`     | No fija ninguno                   | Vacío.                                   |
| `aile.Error`      | `text/plain; charset=utf-8`       | El mensaje y un salto de línea.          |
| `aile.WriteJSON`  | `application/json; charset=utf-8` | El valor codificado y un salto de línea. |
| `aile.DecodeJSON` | No aplica                         | Lee el body de la petición.              |

## Errores comunes

### `WriteJSON` después de escribir el header

Si el handler ya llamó a `w.WriteHeader` o escribió parte del body, `WriteJSON`
no puede cambiar el status. El cliente recibe una respuesta mezclada. Decide el
status antes de escribir y no llames a dos helpers de respuesta en el mismo
camino.

### `DecodeJSON` acepta bodies enormes

`DecodeJSON` no limita el tamaño. Un POST público puede mandar un body de
gigabytes y el decoder lo intenta leer. Envuelve `r.Body` con
`http.MaxBytesReader` antes de llamarlo.

### `Error` agrega un salto de línea

`aile.Error` delega en `http.Error`, que agrega `\n` al final. Si comparas el
body exacto en una prueba, espera el salto. Si necesitas un error JSON, no uses
`Error`; escribe el JSON con `WriteJSON`.

### `Status` no escribe body

`aile.Status(w, http.StatusNoContent)` no manda cuerpo, que es lo correcto para
204. Si usas `Status` con 200, el cliente recibe una respuesta vacía. Para un
200 con cuerpo, usa `Text` o `WriteJSON`.

### `Static` devuelve 404 para rutas que no existen

`http.FileServerFS` responde 404 por su cuenta. Aile no registra un handler de
404 personalizado para estáticos. Si necesitas una página propia, envuelve el
handler o monta un fallback antes.
