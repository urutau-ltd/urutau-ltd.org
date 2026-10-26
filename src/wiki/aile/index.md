---
title: Aile v2
description: Una capa pequeña sobre net/http para construir servidores HTTP en Go.
wiki_project: Aile
---

<img style="width: 100px; height: 100px;"
    src="/img/aile.png"
    alt="Aile from Megaman ZX"
    loading="lazy"/>

Aile es una biblioteca para Go que se apoya en `net/http` y en `http.ServeMux`.
Se apoya en el paquete estándar y agrega un contenedor de aplicación, helpers
para registrar rutas, middleware y un runtime con apagado ordenado. Si vienes de
`chi` o de `hono`, la idea te va a resultar familiar, pero el router sigue
siendo el de la biblioteca estándar.

<!-- Urutaú Aile -->

<small>La imágen del proyecto no es nuestra. Por favor refiere a la página de
<a href="/libre-licenses">Licencias</a> para leer acerca del copyright de la
misma.</small>

> Licencia: AGPLv3.0+

> Desarrollo:
> <chip class="ok">Público en
> <a href="https://codeberg.org/urutau-ltd/aile">Codeberg</a></chip>
> <chip class="info">Espejo en:
> <a href="https://github.com/urutau-ltd/aile">GitHub</a></chip>

## Cuándo elegir Aile

| Si tu caso es...                                                          | Considera...                       |
| ------------------------------------------------------------------------- | ---------------------------------- |
| Una API pequeña con pocas rutas                                           | `net/http` puro o Aile sin extras. |
| Quieres `ServeMux` pero no repetir el arranque, los timeouts y el apagado | Aile.                              |
| Necesitas grupos de rutas, subrouters y middleware por grupo              | `chi` u otro router.               |
| Quieres ORM, admin, migraciones y convenciones de framework               | Un framework completo.             |

Aile se queda en el medio: no te obliga a un router nuevo, pero tampoco te deja
armar el servidor a mano en cada proyecto. La contraparte es que las decisiones
de templates, persistencia, validación y errores siguen siendo tuyas.

## Qué incluye

- Un tipo `App` para construir el servidor, registrar rutas y colgar middleware.
- Helpers `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD` y `OPTIONS`.
- `Run`, `Serve`, `ListenAndServe`, `Shutdown` y `Addr` para controlar el ciclo
  de vida.
- Hooks de inicio y cierre, además de un mapa de valores compartidos.
- Helpers para texto, JSON, errores y archivos estáticos.
- Paquetes opcionales bajo `x/`: autenticación, CORS, compresión, cabeceras de
  seguridad, request IDs, HTMX, health checks y montaje de recursos CRUD.

## Qué deja fuera

Aile no trae grupos de rutas, binding automático de parámetros, ORM, motor de
templates ni un sistema de configuración. Tampoco intenta esconder
`http.ServeMux`: los patrones, la precedencia y los `PathValue` son los de Go.
Las decisiones sobre templates, persistencia, validación y presentación quedan
en tu aplicación.

## Instalación

```bash
$ go get -u codeberg.org/urutau-ltd/aile/v2
```

El módulo declara Go 1.27. Si tu toolchain es anterior, la compilación falla
antes de llegar a tu código.

## Ejemplo mínimo

```go
package main

import (
    "context"
    "log"
    "net/http"

    "codeberg.org/urutau-ltd/aile/v2"
)

func main() {
    app, err := aile.New()
    if err != nil {
        log.Fatal(err)
    }

    app.Use(aile.Recovery())

    app.GET("/ping", func(w http.ResponseWriter, r *http.Request) {
        aile.Text(w, http.StatusOK, "ok")
    })

    if err := app.Run(context.Background()); err != nil {
        log.Fatal(err)
    }
}
```

Con el servidor arriba, `curl http://localhost:9001/ping` responde `ok`. El
puerto por defecto es `:9001`; puedes cambiarlo con `aile.WithAddr(":8080")` o
con `aile.WithConfig`.

## Mapa de la documentación

| Página                               | Qué vas a encontrar                                                      |
| ------------------------------------ | ------------------------------------------------------------------------ |
| [Rutas](/wiki/aile/routing/)         | Patrones de `ServeMux`, métodos, parámetros y pruebas con `httptest`.    |
| [Runtime](/wiki/aile/runtime/)       | `Build`, `Run`, `Serve`, hooks, valores y configuración del servidor.    |
| [Respuestas](/wiki/aile/respuestas/) | Texto, JSON, errores y archivos estáticos.                               |
| [Middleware](/wiki/aile/middleware/) | Orden de ejecución y paquetes de `x/` para auth, CORS, compresión y más. |
| [HTMX](/wiki/aile/htmx/)             | Helpers de `x/htmx` para leer y escribir cabeceras `HX-*`.               |
| [Recursos](/wiki/aile/resource/)     | Montaje de colecciones y singletons CRUD con `x/resource`.               |
| [Migración](/wiki/aile/migracion/)   | Cambios de la v1 a la v2 y lista de verificación.                        |

## Versión documentada

| Dato     | Valor                             |
| -------- | --------------------------------- |
| Módulo   | `codeberg.org/urutau-ltd/aile/v2` |
| Versión  | 2.2.0                             |
| Go       | 1.27                              |
| Licencia | AGPL-3.0-or-later                 |

La versión sale de `version.go` en el repositorio. Si el módulo avanza, revisa
las notas de la versión antes de seguir un ejemplo al pie de la letra.

## Ejemplos en el repositorio

El repositorio incluye tres ejemplos que se pueden leer de corrido:

- `examples/rest-api`: una API JSON pequeña con rutas y helpers de respuesta.
- `examples/htmx-counter`: una página HTML con HTMX y respuestas parciales.
- `examples/html-admin`: un panel CRUD con `x/resource` y templates.

Están pensados para copiarse a un directorio aparte, no para ejecutarse dentro
del módulo.
