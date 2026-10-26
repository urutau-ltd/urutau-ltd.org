---
title: forge-cli - Comandos
description: Referencia de las acciones y flags de forge-cli.
wiki_project: forge-cli
---

La forma general es:

```text
forge-cli ACTION [ARGS] [OPTIONS]
```

Las acciones se agrupan por objeto. La mayoría imprime JSON; las excepciones se
indican en la tabla.

## Opciones globales

| Opción            | Qué hace                                             |
| ----------------- | ---------------------------------------------------- |
| `--config PATH`   | Usa otro archivo de claves.                          |
| `--host HOST`     | Elige la entrada de `hosts` en el archivo de claves. |
| `--version`, `-v` | Imprime la versión y sale.                           |
| `help`, `--help`  | Imprime el uso y sale.                               |

`help` funciona sin repositorio ni archivo de configuración. `--version`
también.

Algunos flags tienen alias corto: `-c` para `--config`, `-h` para `--host`, `-b`
para `--body` y `-s` para `--state`. Ojo con `-h`: es host, no ayuda. La ayuda
se pide con `help` o `--help`.

## Repositorio

### `repo-view`

```bash
$ forge-cli repo-view REPO
```

Imprime el JSON del repositorio.

```bash
$ forge-cli repo-view urutau-ltd/aile
```

## Issues

### `issue-search`

```bash
$ forge-cli issue-search REPO [QUERY] [--state open|closed|all]
```

Busca issues. Si omites `--state`, el parámetro no se envía y la API decide el
valor por defecto.

```bash
$ forge-cli issue-search urutau-ltd/aile "panic" --state open
```

### `issue-create`

```bash
$ forge-cli issue-create REPO TITLE [--body BODY]
```

Crea un issue. El título no puede estar vacío; el body es opcional.

```bash
$ forge-cli issue-create urutau-ltd/aile "Falta un ejemplo" \
    --body "El README no muestra el caso de uso con templates."
```

### `issue-edit`

```bash
$ forge-cli issue-edit REPO NUMBER \
    [--body BODY] \
    [--labels NAME[,NAME...]] \
    [--milestone ID|TITLE] \
    [--assignees USER[,USER...]] \
    [--state open|closed]
```

Edita un issue. Las etiquetas se resuelven por nombre contra la API; si una no
existe, el comando falla. El hito acepta un ID numérico o un título. Los
assignees se pasan separados por coma. El máximo de etiquetas es 16.

Si no pasas ningún flag, el comando devuelve el issue tal como está.

```bash
$ forge-cli issue-edit urutau-ltd/aile 42 \
    --labels bug,docs --assignees usuario --state closed
```

### `issue-block` y `issue-unblock`

```bash
$ forge-cli issue-block REPO BLOCKER --blocked N[,N...]
$ forge-cli issue-unblock REPO BLOCKER --blocked N[,N...]
```

Bloquea o desbloquea uno o más issues. `BLOCKER` es el número del issue que
bloquea; `--blocked` es la lista de issues bloqueados. El máximo es 16 por
llamada.

```bash
$ forge-cli issue-block urutau-ltd/aile 10 --blocked 11,12
```

## Comentarios

### `comment-create`

```bash
$ forge-cli comment-create REPO NUMBER --body BODY
```

Crea un comentario. El body no puede estar vacío.

```bash
$ forge-cli comment-create urutau-ltd/aile 42 --body "Confirmado en la v2.2.0."
```

### `comment-list`

```bash
$ forge-cli comment-list REPO NUMBER [LIMIT]
```

Lista comentarios. Si omites `LIMIT`, usa 100.

### `comment-edit`

```bash
$ forge-cli comment-edit REPO COMMENT-ID --body BODY
```

Edita un comentario por su ID global, no por el número de issue. El body no
puede estar vacío.

### `comment-delete`

```bash
$ forge-cli comment-delete REPO COMMENT-ID
```

Borra un comentario. En vez de JSON, imprime una línea de confirmación:

```text
Comment 123 deleted from repository urutau-ltd/aile
```

## Etiquetas e hitos

### `label-list`

```bash
$ forge-cli label-list REPO [LIMIT]
```

Lista etiquetas. El límite por defecto es 100.

### `milestone-list`

```bash
$ forge-cli milestone-list REPO [LIMIT]
```

Lista hitos, incluyendo abiertos y cerrados. El límite por defecto es 100.

## Pull requests

### `pr-view`

```bash
$ forge-cli pr-view REPO NUMBER
```

Imprime el JSON de un pull request.

### `pr-create`

```bash
$ forge-cli pr-create REPO TITLE --head BRANCH --base BRANCH [--body BODY]
```

Crea un pull request. `--head` y `--base` son obligatorios. En la implementación
actual el body también tiene que ser no vacío, aunque el uso lo muestre como
opcional.

```bash
$ forge-cli pr-create urutau-ltd/aile "Arregla el README" \
    --head docs/readme --base main --body "Corrige los ejemplos de instalación."
```

## Ejemplos con jq

Como casi todo sale en JSON, se puede filtrar:

```bash
# Títulos de issues abiertos
$ forge-cli issue-search urutau-ltd/aile --state open | jq -r '.[].title'

# Número y título de los pull requests
$ forge-cli pr-view urutau-ltd/aile 7 | jq '{number, title, state}'
```

`comment-delete` no entra en ese flujo porque imprime texto plano.

## Comportamiento real

La referencia de arriba sigue la ayuda del binario. Hay algunos detalles que la
ayuda no dice y que conviene conocer antes de scriptar:

- `pr-create` exige un body no vacío en la implementación actual, aunque el uso
  lo muestre entre corchetes.
- `issue-edit` con todos los flags vacíos no manda un patch: devuelve el issue
  actual. Es una lectura cómoda, no una escritura.
- `issue-edit --labels` resuelve nombres contra la API. Si una etiqueta no
  existe, falla; no la crea.
- `issue-edit --milestone` acepta un ID numérico o un título exacto. Si el
  título no existe, falla.
- `issue-block` y `issue-unblock` aceptan hasta 16 issues por llamada.
- `comment-list`, `label-list` y `milestone-list` usan 100 como límite por
  defecto. No hay paginación: si necesitas más, el cliente no la expone.
- `comment-delete` imprime texto plano, no JSON.
- `issue-search` sin `--state` no manda el parámetro; el valor por defecto lo
  decide la API de Forgejo.

Si un comando falla, el error sale por stderr y el proceso termina con código
distinto de cero. En un script, revisa el código de salida antes de parsear el
JSON.

## Lo que no hay

No hay un comando para mergear pull requests, para crear ramas, para ver el diff
de un PR ni para administrar usuarios. Tampoco hay un modo interactivo. Esas
ausencias son parte del diseño: el cliente cubre el circuito de issues y PRs, y
deja el resto a la interfaz web o a `git`.
