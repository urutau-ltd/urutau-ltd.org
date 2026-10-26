---
title: Vexilo - Request State
description: Request view limiter
wiki_project: Vexilo
---

El paquete `requeststate` parsea los parámetros de petición compartidos por las
vistas de lista.

Solo lee los campos `q` y `limit` que las páginas de lista HTML-first comparten
entre query strings GET y bodies `application/x-www-form-urlencoded`.

## Tipos

### `ListState`

```go
type ListState struct {
    Query string
    Limit int
}
```

- `Query` proviene del campo de formulario `q` después de `strings.TrimSpace`.
- `Limit` proviene del campo `limit` después de aplicar el default y el máximo
  del llamador.

---

## Funciones

### `Parse`

```go
func Parse(r *http.Request, defaultLimit, maxLimit int) ListState
```

Lee `q` y `limit` de `r.Form` después de llamar a `r.ParseForm`.

Soporta tanto query string como body `application/x-www-form-urlencoded`. Cuando
ambos están presentes en la misma petición POST, el body de formulario tiene
prioridad sobre la query string.

#### Comportamiento de límites

| Caso                                              | Resultado      |
| ------------------------------------------------- | -------------- |
| `limit` ausente                                   | `defaultLimit` |
| `limit` no es un entero válido                    | `defaultLimit` |
| `limit` es `0` o negativo                         | `defaultLimit` |
| `limit` supera `maxLimit` (cuando `maxLimit > 0`) | `maxLimit`     |
| `limit` válido dentro del rango                   | valor parseado |

#### Comportamiento con `r == nil`

Devuelve `ListState{Limit: defaultLimit}` con `Query` vacío.

---

## Ejemplo

```go
// GET /providers?q=++Acme++&limit=250
// defaultLimit=25, maxLimit=100
state := requeststate.Parse(r, 25, 100)
// state.Query == "Acme"
// state.Limit == 100  (clamped)
```

```go
// POST con body: q=abc&limit=20
// Content-Type: application/x-www-form-urlencoded
state := requeststate.Parse(r, 10, 100)
// state.Query == "abc"
// state.Limit == 20
```

---

## Detalles que conviene saber

`Parse` llama a `r.ParseForm` e ignora el error. Si el body está mal formado o
el content type no es `application/x-www-form-urlencoded`, `r.Form` puede quedar
vacío y el resultado será `Query` vacío con `defaultLimit`. No es un parser
estricto; es un lector de conveniencia.

`limit` se parsea con `strconv.Atoi`. Un valor con espacios, por ejemplo
`" 25"`, no es válido y cae al default. `maxLimit <= 0` desactiva el tope: el
valor parseado se usa tal cual, siempre que sea positivo.

Cuando la misma clave viene en la query string y en el body de un POST,
`r.Form.Get` devuelve el valor del body. Eso es comportamiento de `net/http`, no
una decisión de Vexilo.
