---
title: Vexilo - Panel CRUD
description: Pantallas para flujos CRUD con vista dividida
wiki_project: Vexilo
---

## panelcrud

El paquete `panelcrud` es una capa de ayuda pequeña para pantallas CRUD
HTML-first con vista dividida lista/editor.

Construye sobre `htmx` y `fragment` sin reemplazarlos. La aplicación sigue
siendo dueña del renderizado de página completa, templates, avisos, y todo el
markup. `panelcrud` solo ayuda con dos tareas repetitivas:

- detectar si una petición HTMX apunta al lado de la lista o al editor
- componer la forma de respuesta habitual: fragmento principal del editor + OOB
  de tbody para la lista

No crea handlers, formularios, rutas, repositorios ni componentes de
presentación.

## Tipos

### `Targets`

```go
type Targets struct {
    ListBody         string
    Editor           string
    ListTriggerIDs   []string
    ListTriggerNames []string
}
```

| Campo              | Descripción                                                         |
| ------------------ | ------------------------------------------------------------------- |
| `ListBody`         | ID del `tbody` que se refresca out-of-band después de mutaciones    |
| `Editor`           | Target HTMX para peticiones al editor                               |
| `ListTriggerIDs`   | Valores de `HX-Trigger` que se tratan como peticiones de lista      |
| `ListTriggerNames` | Valores de `HX-Trigger-Name` que se tratan como peticiones de lista |

### `Update`

```go
type Update struct {
    Editor []byte
    List   []byte
    OOB    [][]byte
}
```

| Campo    | Descripción                                                                        |
| -------- | ---------------------------------------------------------------------------------- |
| `Editor` | HTML que se escribe como fragmento principal                                       |
| `List`   | HTML que se inserta como innerHTML del `tbody` identificado por `Targets.ListBody` |
| `OOB`    | Fragmentos OOB adicionales del llamador, añadidos después del refresh de lista     |

## Métodos

### `IsListRequest`

```go
func (t Targets) IsListRequest(r *http.Request) bool
```

Delega en `htmx.IsListRequest` con `t.ListBody`, `t.ListTriggerIDs` y
`t.ListTriggerNames`.

---

### `IsEditorRequest`

```go
func (t Targets) IsEditorRequest(r *http.Request) bool
```

Delega en `htmx.IsEditorRequest` con `t.Editor`.

---

### `EditorWithList`

```go
func (t Targets) EditorWithList(update Update) (fragment.Page, error)
```

Construye la forma habitual de respuesta HTMX para una mutación CRUD:

- `fragment.Page.Main` ← `update.Editor`
- `fragment.Page.OOB[0]` ←
  `fragment.OOB("tbody", t.ListBody, "innerHTML", update.List)`
- `fragment.Page.OOB[1:]` ← `update.OOB`

Devuelve error si `t.ListBody` está vacío.

---

### `WriteEditorWithList`

```go
func (t Targets) WriteEditorWithList(w http.ResponseWriter, update Update) error
```

Equivale a llamar `EditorWithList` y pasar el resultado a `fragment.WriteHTML`.
Establece `Content-Type: text/html; charset=utf-8`.

---

## Ejemplo completo

```go
var providers = panelcrud.Targets{
    ListBody:         "providers-body",
    Editor:           "provider-editor",
    ListTriggerIDs:   []string{"provider-search"},
    ListTriggerNames: []string{"q"},
}

func handleProviders(w http.ResponseWriter, r *http.Request) {
    state := requeststate.Parse(r, 10, 100)

    switch {
    case htmx.IsBoosted(r), !isHTMX(r):
        // página completa: responsabilidad de la aplicación
        renderFullPage(w, state)

    case providers.IsListRequest(r):
        _ = fragment.WriteHTML(w, fragment.Page{
            Main: renderList(state),
            OOB: [][]byte{
                fragment.OOB("tbody", "providers-body", "innerHTML", renderRows(state)),
            },
        })

    case providers.IsEditorRequest(r):
        _ = fragment.WriteHTML(w, fragment.Page{
            Main: renderEditor(nil),
        })
    }
}

func handleProviderSave(w http.ResponseWriter, r *http.Request) {
    state := requeststate.Parse(r, 10, 100)
    // ... lógica de guardado ...

    _ = providers.WriteEditorWithList(w, panelcrud.Update{
        Editor: renderEditor(saved),
        List:   renderRows(state),
        OOB: [][]byte{
            fragment.OOB("output", "notice", "true", []byte(`Guardado`)),
        },
    })
}
```

---

## Orden de OOB en la respuesta

Dado un `Update` con `OOB` de N elementos, el body de la respuesta tiene esta
forma:

```
<editor HTML>
<table hidden ...><tbody id="ListBody" ...><List HTML></tbody></table>
<OOB[0]>
<OOB[1]>
...
<OOB[N-1]>
```

---

## Límites

`EditorWithList` solo devuelve error cuando `Targets.ListBody` está vacío. Un
`Update.Editor` vacío o un `Update.List` vacío no son errores: el paquete
escribe lo que le pases, aunque el resultado sea un fragmento sin contenido.

`WriteEditorWithList` no fija el status. Si el guardado falla y quieres un `422`
o un `500`, llama a `w.WriteHeader` antes o escribe tu propia respuesta. El
content type sí queda en `text/html; charset=utf-8`.

La lista se inserta como `innerHTML` del `tbody`, no como HTML completo. Si tu
template devuelve `<tr>` sueltos, están en el formato correcto. Si devuelve una
tabla completa, vas a anidar una tabla dentro de un `tbody`.

El orden de los OOB es el del slice: primero el refresh de la lista, después los
fragmentos de `Update.OOB`. Si un aviso depende de que la lista ya esté
actualizada, ese orden es el que necesitas.
