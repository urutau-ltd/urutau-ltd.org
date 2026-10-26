---
title: Vexilo - Fragment
description: Snippets de HTMX para operaciones de presentación
wiki_project: Vexilo
---

## fragment

El paquete `fragment` escribe respuestas HTML y compone fragmentos HTMX
out-of-band.

Es deliberadamente estrecho y sin opinión sobre presentación. El llamador provee
los bytes HTML; Vexilo los escribe o los envuelve sin transformarlos.

---

## Tipos

### `Page`

```go
type Page struct {
    Main []byte
    OOB  [][]byte
}
```

- `Main` se escribe primero.
- `OOB` se escribe después en orden de slice.
- Vexilo no transforma, escapa ni sanitiza estos bytes.

---

## Funciones

### `WriteHTML`

```go
func WriteHTML(w http.ResponseWriter, page Page) error
```

Escribe `page` en `w` con el content type exacto `text/html; charset=utf-8`.

Siempre establece el header `Content-Type` antes de escribir. Escribe
`Page.Main` primero y luego cada entrada de `Page.OOB` en orden.

Devuelve error si `w` es `nil` o si falla alguna escritura.

---

### `OOB`

```go
func OOB(tag, id, swap string, inner []byte) []byte
```

Construye un fragmento HTMX out-of-band. El HTML interno del llamador se inserta
literalmente.

#### Caso general

Para cualquier tag excepto `tbody`:

```html
<tag id="..." hx-swap-oob="...">inner</tag>
```

#### Caso especial de `tbody`

Cuando `tag` es `tbody`, el fragmento se envuelve en una tabla oculta para que
el HTML resultante sea válido y HTMX pueda procesarlo:

```html
<table hidden aria-hidden="true">
    <tbody id="..." hx-swap-oob="...">inner</tbody>
</table>
```

---

## Ejemplos

```go
// Respuesta con fragmento principal y OOB
err := fragment.WriteHTML(w, fragment.Page{
    Main: renderEditor(),
    OOB: [][]byte{
        fragment.OOB("tbody", "providers-body", "innerHTML", renderRows(state)),
        fragment.OOB("section", "notice", "outerHTML", renderNotice()),
    },
})
```

```go
// OOB de tbody (produce wrapper de tabla)
frag := fragment.OOB("tbody", "providers-body", "innerHTML", []byte(`<tr><td>A</td></tr>`))
// <table hidden aria-hidden="true"><tbody id="providers-body" hx-swap-oob="innerHTML"><tr><td>A</td></tr></tbody></table>
```

```go
// OOB de tag genérico
frag := fragment.OOB("section", "provider-editor", "outerHTML", []byte(`<p>Hello</p>`))
// <section id="provider-editor" hx-swap-oob="outerHTML"><p>Hello</p></section>
```

---

## Propiedad del HTML

La aplicación es responsable del HTML que pasa a `WriteHTML` y a `OOB`. Vexilo
no escapa ni sanitiza nada.

---

## Atributos y confianza

`WriteHTML` no llama a `WriteHeader`. El status queda en 200 salvo que lo hayas
escrito antes; el content type sí se fija siempre.

`OOB(tag, id, swap, inner)` inserta `tag`, `id` y `swap` sin escaparlos. El
paquete asume que son constantes de la aplicación. Si algún valor viene de la
petición, valídalo contra una lista cerrada o escápalo antes de llamar. Lo mismo
aplica a `inner`: es HTML del llamador y se escribe tal cual.

El caso `tbody` envuelve el fragmento en `<table hidden aria-hidden="true">`.
Ese wrapper no es decorativo: sin él, un `<tbody>` suelto no es HTML válido y
HTMX puede no procesarlo como esperas.
