---
title: Aile v2 - HTMX
description: Helpers de x/htmx para leer y escribir cabeceras HX.
wiki_project: Aile
---

`x/htmx` es un paquete pequeño para no parsear cabeceras `HX-*` a mano. No
renderiza templates ni decide qué fragmento devolver: eso sigue en tu handler.
Si necesitas detectar listas y editores con reglas más estrictas, Vexilo cubre
esa parte; aquí tienes las funciones de base.

## Leer la petición

```go
import "codeberg.org/urutau-ltd/aile/v2/x/htmx"

app.GET("/os/{id}/edit", func(w http.ResponseWriter, r *http.Request) {
    if htmx.IsRequest(r) && htmx.TargetIs(r, "os-editor") {
        renderEditor(w, r.PathValue("id"))
        return
    }

    renderFullPage(w, r.PathValue("id"))
})
```

| Función                           | Devuelve                                                    |
| --------------------------------- | ----------------------------------------------------------- |
| `htmx.IsRequest(r)`               | `true` si `HX-Request` vale `true`.                         |
| `htmx.IsBoosted(r)`               | `true` si `HX-Boosted` vale `true`.                         |
| `htmx.Target(r)`                  | El valor de `HX-Target`, sin espacios.                      |
| `htmx.Trigger(r)`                 | El valor de `HX-Trigger`.                                   |
| `htmx.TriggerName(r)`             | El valor de `HX-Trigger-Name`.                              |
| `htmx.TargetIs(r, ids...)`        | Compara `HX-Target` con uno o más IDs; acepta `#id` o `id`. |
| `htmx.TriggerIs(r, ids...)`       | Compara `HX-Trigger` con uno o más valores exactos.         |
| `htmx.TriggerNameIs(r, names...)` | Compara `HX-Trigger-Name` con uno o más valores exactos.    |

`IsRequest` e `IsBoosted` usan `EqualFold`, así que el valor `True` también
cuenta. Las comparaciones de trigger son exactas, sin recortar el `#`.

## Escribir la respuesta

```go
app.POST("/os/{id}/edit", func(w http.ResponseWriter, r *http.Request) {
    // ... guardar ...
    htmx.SetTrigger(w, "os:changed")
    htmx.Redirect(w, "/os")
    aile.Status(w, http.StatusNoContent)
})
```

| Función                                    | Cabecera                  |
| ------------------------------------------ | ------------------------- |
| `htmx.Redirect(w, url)`                    | `HX-Redirect`             |
| `htmx.Location(w, url)`                    | `HX-Location`             |
| `htmx.PushURL(w, url)`                     | `HX-Push-Url`             |
| `htmx.ReplaceURL(w, url)`                  | `HX-Replace-Url`          |
| `htmx.Refresh(w)`                          | `HX-Refresh: true`        |
| `htmx.Reswap(w, strategy)`                 | `HX-Reswap`               |
| `htmx.Retarget(w, target)`                 | `HX-Retarget`             |
| `htmx.SetTrigger(w, events...)`            | `HX-Trigger`              |
| `htmx.SetTriggerAfterSwap(w, events...)`   | `HX-Trigger-After-Swap`   |
| `htmx.SetTriggerAfterSettle(w, events...)` | `HX-Trigger-After-Settle` |

Las funciones de eventos aceptan varios nombres y los unen con `,`. Los valores
vacíos se descartan. Las funciones de URL y target también ignoran cadenas
vacías, así que no sobrescriben una cabecera con basura.

## Un patrón típico

```go
if !htmx.IsRequest(r) || htmx.IsBoosted(r) {
    renderPage(w, state)
    return
}

switch {
case htmx.TargetIs(r, "providers-body"):
    renderList(w, state)
case htmx.TargetIs(r, "provider-editor"):
    renderEditor(w, state)
default:
    aile.Status(w, http.StatusNoContent)
}
```

La primera condición cubre la navegación normal y la navegación boosted: las dos
necesitan la página completa. Después vienen las peticiones parciales.

## Relación con Vexilo

`aile/x/htmx` y `vexilo/htmx` se parecen, pero no son lo mismo. El primero es un
conjunto de helpers de cabeceras para cualquier aplicación. El segundo detecta
intenciones concretas de lista y editor, y se apoya en `fragment` y `panelcrud`
para componer respuestas. Si ya usas Vexilo, no necesitas duplicar esa lógica
con `aile/x/htmx`.
