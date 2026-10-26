---
title: Aile v2 - Patrones
description: Recetas completas para API JSON, HTML, estáticos y apagado.
wiki_project: Aile
---

Las páginas de referencia explican cada pieza. Esta junta varias en esqueletos
que se pueden copiar y adaptar. No son aplicaciones completas: faltan dominio,
persistencia y validación.

## API JSON con middleware

```go
package main

import (
    "context"
    "log"
    "log/slog"
    "net/http"

    "codeberg.org/urutau-ltd/aile/v2"
    "codeberg.org/urutau-ltd/aile/v2/x/combine"
    "codeberg.org/urutau-ltd/aile/v2/x/cors"
    requestid "codeberg.org/urutau-ltd/aile/v2/x/request_id"
    "codeberg.org/urutau-ltd/aile/v2/x/secure_headers"
)

type Article struct {
    ID    string `json:"id"`
    Title string `json:"title"`
}

func main() {
    app := aile.MustNew(aile.WithAddr(":8080"))

    app.Use(combine.Middleware(
        aile.Recovery(),
        requestid.Middleware(requestid.Config{Header: "X-Request-ID"}),
        secure_headers.Middleware(secureheaders.Config{
            ContentTypeNosniff: true,
            FrameDeny:          true,
        }),
        cors.Middleware(cors.Config{
            AllowOrigins: []string{"https://app.example.com"},
            AllowMethods: []string{"GET", "POST"},
            AllowHeaders: []string{"Content-Type", "Authorization"},
        }),
    ))

    app.GET("/healthz", func(w http.ResponseWriter, r *http.Request) {
        aile.Text(w, http.StatusOK, "ok")
    })

    app.POST("/articles", func(w http.ResponseWriter, r *http.Request) {
        r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

        article, err := aile.DecodeJSON[Article](r)
        if err != nil {
            aile.Error(w, http.StatusBadRequest, "json inválido")
            return
        }

        if err := aile.WriteJSON(w, http.StatusCreated, article); err != nil {
            slog.Error("write json", "error", err)
        }
    })

    if err := app.Run(context.Background()); err != nil {
        log.Fatal(err)
    }
}
```

El orden importa: `Recovery` queda dentro de `logger` si agregas uno, y CORS
responde los preflight antes de llegar al handler. El `MaxBytesReader` no viene
en `DecodeJSON`; lo pones tú.

## HTML con templates y estáticos

```go
//go:embed templates/*.html public/*
var content embed.FS

func main() {
    app := aile.MustNew()

    pages, err := template.ParseFS(content, "templates/*.html")
    if err != nil {
        log.Fatal(err)
    }

    public, err := fs.Sub(content, "public")
    if err != nil {
        log.Fatal(err)
    }

    if err := app.Static("/assets", public); err != nil {
        log.Fatal(err)
    }

    app.GET("/", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "text/html; charset=utf-8")
        if err := pages.ExecuteTemplate(w, "index.html", nil); err != nil {
            log.Println("template:", err)
        }
    })

    app.GET("/fragment", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "text/html; charset=utf-8")
        if err := pages.ExecuteTemplate(w, "rows.html", nil); err != nil {
            log.Println("template:", err)
        }
    })

    if err := app.Run(context.Background()); err != nil {
        log.Fatal(err)
    }
}
```

Aile no tiene un helper de templates. `html/template` y `embed.FS` alcanzan. Si
el handler escribe el header después de un error de template, el status puede
quedar en 200 con un body incompleto; para producción, renderiza a un buffer
primero y escribe una sola vez.

## Apagado ordenado

```go
func main() {
    app := aile.MustNew(aile.WithAddr(":8080"))

    app.OnStart(func(ctx context.Context, st *aile.State) error {
        log.Println("escuchando en", st.Config.Addr)
        return nil
    })

    app.OnShutdown(func(ctx context.Context, st *aile.State) error {
        log.Println("cerrando")
        return nil
    })

    if err := app.Run(context.Background()); err != nil {
        log.Fatal(err)
    }
}
```

`Run` atiende `SIGINT` y `SIGTERM` y usa `ShutdownTimeout` para el apagado. Si
necesitas cancelar desde código, pasa un contexto que puedas cancelar:

```go
ctx, cancel := context.WithCancel(context.Background())
defer cancel()

go func() {
    <-someStopSignal
    cancel()
}()

if err := app.Run(ctx); err != nil {
    log.Fatal(err)
}
```

`Serve` es la variante para tests de integración: tú abres el listener, tú
decides cuándo cerrarlo.

## Probar la aplicación completa

```go
func TestCreateArticle(t *testing.T) {
    app := aile.MustNew()
    app.POST("/articles", func(w http.ResponseWriter, r *http.Request) {
        article, err := aile.DecodeJSON[Article](r)
        if err != nil {
            aile.Error(w, http.StatusBadRequest, "json inválido")
            return
        }
        _ = aile.WriteJSON(w, http.StatusCreated, article)
    })

    st, err := app.Build(context.Background())
    if err != nil {
        t.Fatal(err)
    }

    body := strings.NewReader(`{"id":"1","title":"Hola"}`)
    req := httptest.NewRequest(http.MethodPost, "/articles", body)
    req.Header.Set("Content-Type", "application/json")
    rec := httptest.NewRecorder()

    st.Handler.ServeHTTP(rec, req)

    if rec.Code != http.StatusCreated {
        t.Fatalf("status = %d", rec.Code)
    }
}
```

Como `Build` aplica el middleware, la prueba cubre también `Recovery`, CORS y
request IDs. Es más lenta que probar el handler suelto, pero detecta errores de
cableado.

## Elegir el esqueleto

| Necesitas                           | Empieza por             |
| ----------------------------------- | ----------------------- |
| API JSON con CORS y logs            | El primer ejemplo.      |
| Página HTML con HTMX                | El segundo, más Vexilo. |
| Servicio que se apaga con una señal | El tercero.             |
| Probar rutas sin abrir puertos      | El cuarto.              |

No hay un generador de proyectos. Copia el esqueleto, borra lo que no uses y
sigue el resto de la wiki para las piezas concretas.
