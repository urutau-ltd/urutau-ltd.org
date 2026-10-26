---
title: Vexilo - HTMX
description: Utilidades para HTMX
wiki_project: Vexilo
---

El paquete `htmx` detecta un conjunto pequeño de intenciones de peticiones HTMX.

Es intencionalmente mecánico: no hace routing ni construye UI. Solo lee
cabeceras HTMX para responder preguntas concretas.

---

## Funciones

### `IsBoosted`

```go
func IsBoosted(r *http.Request) bool
```

Devuelve `true` únicamente cuando la petición contiene `HX-Boosted: true`.

---

### `IsListRequest`

```go
func IsListRequest(r *http.Request, target string, triggerIDs []string, triggerNames []string) bool
```

Devuelve `true` únicamente cuando se cumplen todas estas condiciones:

1. `HX-Request: true` está presente
2. La petición **no** es navegación boosted
3. Al menos una de estas coincide:
   - `HX-Target` coincide con `target`
   - `HX-Trigger` coincide con alguno de `triggerIDs`
   - `HX-Trigger-Name` coincide con alguno de `triggerNames`

#### Normalización de targets

`HX-Target` y `target` aceptan ambas formas: `providers-body` y
`#providers-body`. El `#` se descarta antes de comparar, por lo que cualquier
combinación funciona.

| `HX-Target` header | `target` argumento | Resultado  |
| ------------------ | ------------------ | ---------- |
| `providers-body`   | `providers-body`   | ✓ coincide |
| `#providers-body`  | `providers-body`   | ✓ coincide |
| `providers-body`   | `#providers-body`  | ✓ coincide |
| `#providers-body`  | `#providers-body`  | ✓ coincide |

#### Casos que devuelven `false`

- `HX-Request` ausente (petición plain, no HTMX)
- `HX-Boosted: true` presente
- Ningún target, trigger ID ni trigger name coincide

---

### `IsEditorRequest`

```go
func IsEditorRequest(r *http.Request, target string) bool
```

Devuelve `true` únicamente cuando se cumplen todas estas condiciones:

1. `target` no es vacío
2. `HX-Request: true` está presente
3. La petición **no** es navegación boosted
4. `HX-Target` coincide con `target`

La normalización de targets es idéntica a la de `IsListRequest`.

---

## Ejemplos

```go
// Detección por HX-Target
if htmx.IsListRequest(r, "providers-body", nil, nil) {
    // ...
}

// Detección por trigger ID o trigger name
if htmx.IsListRequest(r, "providers-body", []string{"provider-search"}, []string{"q"}) {
    // ...
}

// Detección de petición al editor
if htmx.IsEditorRequest(r, "provider-editor") {
    // ...
}

// Detección de navegación boosted
if htmx.IsBoosted(r) {
    // renderizar página completa
}
```

---

## Valores exactos

Vexilo compara los valores de las cabeceras de forma exacta. `HX-Request` tiene
que ser `true`, no `True` ni `1`. `HX-Boosted` sigue la misma regla. Los
triggers se comparan sin recortar espacios: si el navegador manda
`"provider-search "`, no coincide con `"provider-search"`.

`normalizeTarget` solo quita un `#` inicial. Acepta `providers-body` y
`#providers-body`, pero no corrige espacios ni selectores más complejos. Si
necesitas comparar un selector CSS completo, hazlo en tu handler.

## Relación con aile/x/htmx

`aile/x/htmx` usa `EqualFold` y recorta espacios en varios helpers. Vexilo es
más estricto porque su objetivo es clasificar peticiones de una vista partida,
no leer cabeceras sueltas. No mezcles las dos expectativas en el mismo handler:
si usas Vexilo para decidir la rama, deja que Vexilo haga la comparación.
