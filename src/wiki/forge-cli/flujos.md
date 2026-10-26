---
title: forge-cli - Flujos
description: Tareas concretas con forge-cli y jq.
wiki_project: forge-cli
---

La referencia de comandos dice qué flags existen. Esta página muestra cómo
combinarlos para tareas que se repiten. Todos los ejemplos suponen que `--host`
ya está configurado o que usas el servidor de Urutaú por defecto.

## Triage de issues

Lista los issues abiertos y quédate con número, título y etiquetas:

```bash
$ forge-cli issue-search urutau-ltd/aile --state open \
    | jq -r '.[] | "\(.number)\t\(.title)\t\([.labels[].name] | join(","))"'
```

Para buscar solo los que no tienen asignado:

```bash
$ forge-cli issue-search urutau-ltd/aile --state open \
    | jq '.[] | select((.assignees // []) | length == 0) | {number, title}'
```

Si el proyecto usa hitos, lista los abiertos antes de asignar:

```bash
$ forge-cli milestone-list urutau-ltd/aile | jq '.[] | {id, title, state}'
```

## Cerrar un issue con contexto

`issue-edit` permite cambiar estado, etiquetas, assignees y hito en una sola
llamada. Las etiquetas se resuelven por nombre, así que un error de tipeo falla
en vez de crear una etiqueta nueva.

```bash
$ forge-cli issue-edit urutau-ltd/aile 42 \
    --state closed \
    --labels bug,docs \
    --assignees usuario \
    --milestone 3
```

Si no pasas ningún flag, el comando devuelve el issue sin cambios. Eso sirve
para leer el estado actual sin usar `issue-search`:

```bash
$ forge-cli issue-edit urutau-ltd/aile 42 | jq '{number, title, state}'
```

## Crear un issue desde un archivo

`--body` recibe un string. Para un body largo, usa la sustitución de shell:

```bash
$ forge-cli issue-create urutau-ltd/aile "Resumen del problema" \
    --body "$(cat descripcion.md)"
```

El título no puede estar vacío. El body sí es opcional en `issue-create`.

## Revisar un pull request

```bash
$ forge-cli pr-view urutau-ltd/aile 7 \
    | jq '{number, title, state, user: .user.login, base: .base.ref, head: .head.ref}'
```

Para ver los archivos que toca, `pr-view` no alcanza: devuelve el PR, no el
diff. El diff se consulta con la API de Forgejo o con `git`. `forge-cli` no
reemplaza a `git diff`.

## Abrir un pull request

```bash
$ forge-cli pr-create urutau-ltd/aile "Arregla los ejemplos" \
    --head docs/ejemplos \
    --base main \
    --body "Corrige los bloques de código que no compilaban."
```

`--head` y `--base` son obligatorios. En la implementación actual el body
también tiene que ser no vacío, aunque el uso lo muestre como opcional.

## Scripting

Como la salida es JSON, se puede usar `jq -e` para fallar si no hay resultados:

```bash
$ forge-cli issue-search urutau-ltd/aile "panic" --state open \
    | jq -e 'length > 0' > /dev/null
```

Y se puede guardar un snapshot para comparar entre ejecuciones:

```bash
$ forge-cli issue-search urutau-ltd/aile --state all > issues-$(date +%F).json
```

`comment-delete` es la excepción: imprime texto plano, no JSON. No lo metas en
un pipe que espere JSON.

## Un flujo de revisión semanal

1. `issue-search REPO --state open` para ver qué sigue abierto.
2. `milestone-list REPO` para revisar hitos vencidos.
3. `pr-view REPO N` para los PR pendientes.
4. `issue-edit` para cerrar, etiquetar o reasignar.
5. `comment-create` para dejar una nota con el resultado.

No hay un comando que haga todo eso de una vez. La ventaja de `forge-cli` es que
cada paso se puede scriptar y componer con herramientas estándar.
