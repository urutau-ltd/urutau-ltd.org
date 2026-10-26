---
title: forge-cli
description: Cliente de línea de comandos para Forgejo, escrito en Zig.
wiki_project: forge-cli
---

`forge-cli` nació de una molestia concreta: para revisar un issue o abrir un
pull request había que salir de la terminal y cargar la interfaz web. El cliente
cubre ese circuito corto y devuelve JSON, así que también sirve para scripts.

Está escrito en Zig, no tiene dependencias externas y reutiliza el archivo de
configuración de `forgejo-cli`. Esa última decisión es la más importante: si ya
tenías tokens y aliases configurados, no hay que migrar nada.

## Qué resuelve

| Tarea                    | Comando                                            |
| ------------------------ | -------------------------------------------------- |
| Ver un repositorio       | `repo-view`                                        |
| Triage de issues         | `issue-search`, `issue-edit`                       |
| Abrir un issue           | `issue-create`                                     |
| Comentar                 | `comment-create`, `comment-edit`, `comment-delete` |
| Revisar un pull request  | `pr-view`, `pr-create`                             |
| Listar etiquetas o hitos | `label-list`, `milestone-list`                     |

La salida es JSON en casi todos los casos. Eso permite encadenar `jq`, filtrar
en un script o guardar un snapshot sin depender de un formato de tabla.

## Qué no resuelve

No hace operaciones de git, no mergea pull requests, no administra usuarios ni
organizaciones y no intenta replicar toda la API de Forgejo. Tampoco es
interactivo: cada acción es un comando con argumentos. Si necesitas un flujo con
formularios, la interfaz web sigue siendo mejor.

## Compilar

Con Maak y Guix:

```bash
$ maak build
```

Con Zig directo:

```bash
$ zig build -Doptimize=ReleaseSafe
```

El binario queda en `zig-out/bin/forge-cli`. El proyecto pide Zig 0.16.0.

Como paquete reproducible:

```bash
$ guix build -f ./guix.scm
```

## Primer uso

Crea o reutiliza `~/.local/share/forgejo-cli/keys.json`:

```json
{
    "hosts": {
        "sl.urutau-ltd.org:23231": {
            "type": "Application",
            "name": "forge-cli",
            "token": "tu-token"
        }
    },
    "aliases": {
        "sl.urutau-ltd.org:23231": "https://sl.urutau-ltd.org"
    }
}
```

Después:

```bash
$ forge-cli repo-view urutau-ltd/aile
```

La clave de `hosts` tiene que coincidir con `--host`, incluido el puerto. Si
alias no coincide, el cliente usa el servidor de Urutaú por defecto. Ese detalle
está en [Configuración](/wiki/forge-cli/configuracion/).

## Documentación

| Página                                          | Qué vas a encontrar                            |
| ----------------------------------------------- | ---------------------------------------------- |
| [Comandos](/wiki/forge-cli/comandos/)           | Referencia de acciones, flags y salida.        |
| [Flujos](/wiki/forge-cli/flujos/)               | Triage, revisión de PR y scripting con `jq`.   |
| [Configuración](/wiki/forge-cli/configuracion/) | `keys.json`, hosts, aliases y tokens.          |
| [Desarrollo](/wiki/forge-cli/desarrollo/)       | Estructura, pruebas y cómo agregar una acción. |

## Estado

> Licencia: GPLv3.0+

> Desarrollo:
> <chip class="ok">Público en
> <a href="https://codeberg.org/urutau-ltd/forge-cli">Codeberg</a></chip>
> <chip class="info">Espejo en:
> <a href="https://github.com/urutau-ltd/forge-cli">GitHub</a></chip>

La versión documentada es la 0.1.2. El repositorio de Codeberg se describe como
un espejo de solo lectura; el desarrollo ocurre en el servidor de Urutaú.
