---
title: Vexilo - Integración
description: Un flujo completo de lista y editor con aile, HTMX y Vexilo.
wiki_project: Vexilo
---

Esta página arma un panel CRUD mínimo con `aile`, Vexilo y templates HTML. La
idea es mostrar dónde termina Vexilo y dónde empieza tu aplicación.

## Los targets

```go
var providers = panelcrud.Targets{
    ListBody:         "providers-body",
    Editor:           "provider-editor",
    ListTriggerIDs:   []string{"provider-search"},
    ListTriggerNames: []string{"q"},
}
```

`providers-body` es el `tbody` de la lista. `provider-editor` es el contenedor
del editor. Los triggers cubren el buscador: el formulario puede disparar por
`HX-Trigger` o por `HX-Trigger-Name`.

## La página

```html
<form
    hx-get="/providers"
    hx-target="#providers-body"
    hx-swap="innerHTML"
    hx-trigger="input changed delay:200ms from:#provider-search"
>
    <label for="provider-search">Buscar</label>
    <input id="provider-search" name="q" type="search">
</form>

<table>
    <thead>
        <tr>
            <th>Nombre</th>
            <th>Estado</th>
        </tr>
    </thead>
    <tbody id="providers-body">
        <!-- filas iniciales -->
    </tbody>
</table>

<form hx-post="/providers/1/edit" hx-target="#provider-editor">
    <!-- campos del editor -->
    <button type="submit">Guardar</button>
</form>

<div id="provider-editor"></div>
```

El formulario de búsqueda apunta al `tbody` y pide `innerHTML`. La respuesta
correcta para esa petición son las filas, no una página completa.

## El handler de lectura

```go
func handleProviders(w http.ResponseWriter, r *http.Request) {
    state := requeststate.Parse(r, 25, 100)

    switch {
    case htmx.IsBoosted(r), !htmx.IsRequest(r):
        renderProvidersPage(w, state)

    case providers.IsListRequest(r):
        _ = fragment.WriteHTML(w, fragment.Page{
            Main: renderProviderRows(state),
        })

    case providers.IsEditorRequest(r):
        _ = fragment.WriteHTML(w, fragment.Page{
            Main: renderProviderEditor(nil),
        })

    default:
        aile.Status(w, http.StatusNoContent)
    }
}
```

Las tres ramas tienen responsabilidades distintas:

- La página completa se renderiza cuando la petición no viene de HTMX o cuando
  es una navegación boosted.
- La lista devuelve solo las filas que van dentro del `tbody`.
- El editor devuelve solo el fragmento del editor.

`htmx.IsListRequest` ya descarta las peticiones boosted, pero la primera rama
las atiende antes para que el flujo sea explícito.

## El handler de guardado

```go
func handleProviderSave(w http.ResponseWriter, r *http.Request) {
    state := requeststate.Parse(r, 25, 100)

    // Validar, guardar y obtener el proveedor actualizado.
    saved := saveProvider(r)

    err := providers.WriteEditorWithList(w, panelcrud.Update{
        Editor: renderProviderEditor(saved),
        List:   renderProviderRows(state),
        OOB: [][]byte{
            fragment.OOB("output", "notice", "true", []byte("Guardado")),
        },
    })
    if err != nil {
        log.Println("panelcrud:", err)
    }
}
```

`WriteEditorWithList` escribe el editor como fragmento principal y la lista como
OOB. El HTML que sale tiene esta forma:

```html
<!-- editor -->
<table hidden aria-hidden="true">
    <tbody id="providers-body" hx-swap-oob="innerHTML">
        <!-- filas -->
    </tbody>
</table>
<!-- OOB adicional: aviso -->
```

La tabla oculta alrededor del `tbody` es lo que hace que el HTML sea válido.
HTMX la procesa y descarta el wrapper. El detalle está en
[Fragment](/wiki/vexilo/fragment/#caso-especial-de-tbody).

## Por qué el editor va primero

HTMX toma la respuesta principal y la coloca en el target de la petición. Los
fragmentos con `hx-swap-oob` se procesan aparte, sin importar el target. En una
mutación, el target natural es el editor; la lista se actualiza de forma
out-of-band. Si inviertes las partes, el editor termina dentro de la tabla y el
resultado no es el que quieres.

## Qué queda en tu aplicación

- El routing y el middleware.
- Los templates y el CSS.
- La validación y las reglas de negocio.
- La persistencia.
- La autenticación y autorización.
- El renderizado de la página completa.
- El manejo de errores de escritura.

Vexilo solo compone la respuesta. Si el guardado falla, el error y el estado
parcial son tuyos. Una opción es devolver el editor con un mensaje y no tocar la
lista; otra es devolver un `422` con el formulario. Vexilo no impone ninguna de
las dos.

## Errores de escritura

`fragment.WriteHTML` devuelve el error de `w.Write`. En un handler HTTP real,
para cuando eso falla el cliente ya puede haber recibido parte de la respuesta.
Registra el error y evita intentar escribir una página de error encima. Si
necesitas control total, serializa el HTML antes y escribe una sola vez.

`panelcrud.EditorWithList` solo falla si `ListBody` está vacío. Es un error de
configuración del programador, no una condición de runtime que varíe por
petición.

## Errores comunes

### El target no coincide

```html
<div id="providers-body"></div>
```

Si el formulario apunta a `providers-body` pero el `tbody` tiene otro `id`, la
petición llega al handler pero `IsListRequest` devuelve `false`. Revisa el
`hx-target` y el `id`; el `#` es opcional, el nombre no.

### Falta `HX-Request`

Una petición normal del navegador no lleva `HX-Request: true`. `IsListRequest` e
`IsEditorRequest` devuelven `false` y el handler cae en la página completa. Eso
es correcto; si esperabas un fragmento, el formulario no está usando HTMX o el
atributo `hx-*` está mal escrito.

### La navegación boosted entra por la rama de lista

`IsListRequest` descarta las peticiones boosted, pero si tu `switch` no atiende
primero la página completa, una navegación boosted puede terminar en el
`default`. Mantén la primera rama como en el ejemplo.

### La lista devuelve una tabla completa

El target es un `tbody` con `hx-swap="innerHTML"`. La respuesta tiene que ser
filas, no `<table>...</table>`. Si devuelves la tabla completa, el navegador
anida una tabla dentro de un `tbody` y el resultado se rompe.

### El editor no se actualiza

`WriteEditorWithList` escribe el editor como fragmento principal. El formulario
de guardado tiene que apuntar al contenedor del editor. Si apunta a la tabla, el
editor termina dentro del `tbody`.

### `ListBody` está vacío

`panelcrud.EditorWithList` devuelve error si `Targets.ListBody` está vacío. Es
un error de configuración, no de la petición. Revisa la variable global de
targets.

### El aviso OOB sale antes que la lista

El orden es el del slice: primero el refresh de la lista, después `Update.OOB`.
Si el aviso depende de que la lista ya esté actualizada, respeta ese orden. Si
no depende, da igual, pero el orden fijo hace las pruebas más simples.

## Checklist de la pantalla

1. El `tbody` tiene el `id` de `ListBody`.
2. El editor tiene el `id` de `Editor`.
3. El formulario de búsqueda apunta al `tbody` y usa `hx-swap="innerHTML"`.
4. El formulario de guardado apunta al editor.
5. La primera rama del handler cubre página completa y boosted.
6. La respuesta de lista son filas, no una tabla.
7. El guardado usa `WriteEditorWithList`.
8. Los OOB adicionales van después del refresh de la lista.
