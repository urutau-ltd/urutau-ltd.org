---
title: Vexilo
description: Biblioteca de mecánicas HTMX para vistas partidas de lista y editor.
wiki_project: Vexilo
---

Vexilo es una biblioteca de Go para aplicaciones HTML-first construidas con
[`aile`](https://codeberg.org/urutau-ltd/aile) y [HTMX](https://htmx.org). Cubre
una parte angosta de la mecánica del servidor: parsear el estado de una lista,
detectar la intención de una petición HTMX, escribir HTML y componer fragmentos
out-of-band.

No es un framework. No trae templates, CSS, componentes, autenticación ni
persistencia. La aplicación sigue siendo dueña de todo eso.

## Qué aporta frente a HTMX a mano

HTMX no obliga a una forma de organizar el servidor. Vexilo pone tres reglas que
evitan decisiones repetidas:

- Los targets se comparan igual en todos los handlers: `providers-body` y
  `#providers-body` son lo mismo.
- El refresh de un `tbody` se envuelve en una tabla oculta, que es la forma
  válida de mandar un `tbody` por OOB.
- El estado de la lista y la respuesta editor + lista tienen un tipo y un orden
  fijos.

Es poco código, pero evita que cada handler invente su propia variante.

## Cuándo no usarlo

- Una SPA que solo consume JSON.
- Una aplicación con un único endpoint HTMX y un solo fragmento.
- Un framework que ya trae su propia integración de HTMX y sus convenciones.
- Una pantalla que no tiene lista ni editor; para eso alcanza con `aile/x/htmx`.

## Instalación

```bash
$ go get -u codeberg.org/urutau-ltd/vexilo
```

El módulo declara Go 1.27. La versión documentada es la 1.2.1.

## Paquetes

| Paquete        | Qué resuelve                                                       |
| -------------- | ------------------------------------------------------------------ |
| `requeststate` | Lee `q` y `limit` de query string o de un body de formulario.      |
| `htmx`         | Detecta peticiones de lista, de editor y navegación boosted.       |
| `fragment`     | Escribe respuestas HTML y compone fragmentos OOB.                  |
| `panelcrud`    | Compone la respuesta típica de una mutación CRUD en vista partida. |

## Reglas de diseño

- Superficie de API pequeña.
- Comportamiento explícito.
- Contratos HTML exactos donde hacen falta.
- Sin clases CSS específicas de la aplicación.
- Sin helpers de presentación ni UI generada.

## Ejemplo mínimo

```go
state := requeststate.Parse(r, 10, 100)

if htmx.IsListRequest(r, "providers-body", []string{"provider-search"}, nil) {
    _ = fragment.WriteHTML(w, fragment.Page{
        Main: renderRows(state),
    })
}
```

En este caso el formulario apunta a `#providers-body` con `hx-swap="innerHTML"`,
así que la respuesta es solo el contenido de las filas. Para una mutación que
actualiza el editor y la lista a la vez, `panelcrud` compone las dos partes. El
ejemplo completo está en [Integración](/wiki/vexilo/integracion/).

## Uso previsto

Usa `aile` para routing y middleware. Usa Vexilo para las mecánicas de HTMX y
HTML. Templates, CSS, lógica de dominio, persistencia, auth y layout pertenecen
a la aplicación.

## Propiedad del HTML

- `fragment.Page.Main` y `fragment.Page.OOB` son HTML que provee el llamador.
- `fragment.OOB(...)` inserta el HTML interno literalmente en el wrapper que
  emite.
- Vexilo no escapa ni sanitiza markup.
- La aplicación es responsable del HTML que pasa a Vexilo.

Esa regla incluye los atributos `id`, `tag` y `swap` de `fragment.OOB`. No los
alimentes con datos de usuario sin validarlos; el paquete no los escapa.

## Documentación

| Página                                    | Qué vas a encontrar                                |
| ----------------------------------------- | -------------------------------------------------- |
| [Request State](/wiki/vexilo/requestate/) | Parseo de `q` y `limit`, defaults y límites.       |
| [HTMX](/wiki/vexilo/htmx/)                | Detección de lista, editor y navegación boosted.   |
| [Fragment](/wiki/vexilo/fragment/)        | `Page`, `WriteHTML` y el caso especial de `tbody`. |
| [Panel CRUD](/wiki/vexilo/panelcrud/)     | `Targets`, `Update` y la respuesta editor + lista. |
| [Integración](/wiki/vexilo/integracion/)  | Un flujo completo con `aile`, HTMX y templates.    |

## Estado

> Licencia: AGPLv3.0+

> Desarrollo:
> <chip class="ok">Público en
> <a href="https://codeberg.org/urutau-ltd/vexilo">Codeberg</a></chip>
> <chip class="info">Espejo en:
> <a href="https://github.com/urutau-ltd/vexilo">GitHub</a></chip>
