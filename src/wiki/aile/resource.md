---
title: Aile v2 - Recursos
description: Montaje de rutas CRUD con x/resource.
wiki_project: Aile
---

`x/resource` existe para no repetir siete rutas cada vez que una pantalla CRUD
tiene la misma forma. No genera handlers, formularios ni templates: solo conecta
métodos de tu handler con patrones de `ServeMux`.

## Interfaces

```go
type Collection interface {
    Index(http.ResponseWriter, *http.Request)
    New(http.ResponseWriter, *http.Request)
    Create(http.ResponseWriter, *http.Request)
    Show(http.ResponseWriter, *http.Request)
    Edit(http.ResponseWriter, *http.Request)
    Update(http.ResponseWriter, *http.Request)
    Delete(http.ResponseWriter, *http.Request)
}

type Singleton interface {
    Show(http.ResponseWriter, *http.Request)
    Edit(http.ResponseWriter, *http.Request)
    Update(http.ResponseWriter, *http.Request)
}
```

## Rutas que monta

### Colección

| Método   | Ruta              | Método del handler |
| -------- | ----------------- | ------------------ |
| `GET`    | `/base`           | `Index`            |
| `GET`    | `/base/new`       | `New`              |
| `POST`   | `/base`           | `Create`           |
| `GET`    | `/base/{id}`      | `Show`             |
| `GET`    | `/base/{id}/edit` | `Edit`             |
| `POST`   | `/base/{id}/edit` | `Update`           |
| `DELETE` | `/base/{id}`      | `Delete`           |

### Singleton

| Método | Ruta         | Método del handler |
| ------ | ------------ | ------------------ |
| `GET`  | `/base`      | `Show`             |
| `GET`  | `/base/edit` | `Edit`             |
| `POST` | `/base/edit` | `Update`           |

`Update` usa `POST` a propósito. La idea es que un formulario HTML pueda
enviarlo sin JavaScript ni túneles de método. `Delete` sí usa `DELETE`, así que
necesita un formulario con `hx-delete`, `fetch` o un cliente que lo emita.

## Ejemplo

```go
type providersHandler struct{}

func (providersHandler) Index(w http.ResponseWriter, r *http.Request) {
    aile.Text(w, http.StatusOK, "providers index")
}
func (providersHandler) New(w http.ResponseWriter, r *http.Request) {
    aile.Text(w, http.StatusOK, "providers new")
}
func (providersHandler) Create(w http.ResponseWriter, r *http.Request) {
    aile.Status(w, http.StatusCreated)
}
func (providersHandler) Show(w http.ResponseWriter, r *http.Request) {
    aile.Text(w, http.StatusOK, "provider "+r.PathValue("id"))
}
func (providersHandler) Edit(w http.ResponseWriter, r *http.Request) {
    aile.Text(w, http.StatusOK, "provider edit "+r.PathValue("id"))
}
func (providersHandler) Update(w http.ResponseWriter, r *http.Request) {
    aile.Text(w, http.StatusOK, "provider update "+r.PathValue("id"))
}
func (providersHandler) Delete(w http.ResponseWriter, r *http.Request) {
    aile.Status(w, http.StatusNoContent)
}

func main() {
    app := aile.MustNew()

    if err := resource.MountCollection(app, "/providers", providersHandler{}); err != nil {
        log.Fatal(err)
    }

    if err := app.Run(context.Background()); err != nil {
        log.Fatal(err)
    }
}
```

Para un singleton:

```go
type settingsHandler struct{}

func (settingsHandler) Show(w http.ResponseWriter, r *http.Request)   { /* ... */ }
func (settingsHandler) Edit(w http.ResponseWriter, r *http.Request)   { /* ... */ }
func (settingsHandler) Update(w http.ResponseWriter, r *http.Request) { /* ... */ }

if err := resource.MountSingleton(app, "/app-settings", settingsHandler{}); err != nil {
    log.Fatal(err)
}
```

## Validaciones

`MountCollection` y `MountSingleton` devuelven error si:

- la app es `nil`;
- el handler es `nil`;
- el path base está vacío;
- el path base no empieza con `/`;
- el path base contiene `{` o `}`;
- el path base es `/`.

El path se limpia con `path.Clean`, así que `/providers/` y `/providers` montan
lo mismo. No se permiten parámetros en el path base; los `{id}` los pone el
paquete.

## Qué no resuelve

No hay validación de formularios, redirects después de guardar, mensajes de
error, autorización ni composición de templates. Tampoco decide si `Update`
responde con HTML completo, un fragmento o un `204`. Eso queda en cada método.
Si quieres la forma de respuesta lista/editor, combínalo con
[Vexilo](/wiki/vexilo/panelcrud/).
