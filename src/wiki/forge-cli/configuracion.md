---
title: forge-cli - Configuración
description: Formato de keys.json, hosts, aliases y tokens.
wiki_project: forge-cli
---

`forge-cli` no inventa un formato de configuración. Lee el archivo de
`forgejo-cli`, que por defecto está en:

```text
~/.local/share/forgejo-cli/keys.json
```

Puedes cambiarlo con `--config PATH` y elegir una entrada con `--host HOST`.

## Forma del archivo

```json
{
    "hosts": {
        "sl.urutau-ltd.org:23231": {
            "type": "Application",
            "name": "forge-cli",
            "token": "tu-token-de-forgejo"
        }
    },
    "aliases": {
        "sl.urutau-ltd.org:23231": "https://sl.urutau-ltd.org"
    }
}
```

### `hosts`

Es un objeto donde cada clave es el nombre del host y cada valor tiene tres
campos obligatorios:

| Campo   | Tipo   | Uso                                                |
| ------- | ------ | -------------------------------------------------- |
| `type`  | string | Tipo de credencial. En la práctica, `Application`. |
| `name`  | string | Nombre legible de la credencial.                   |
| `token` | string | Token de la API de Forgejo.                        |

La clave tiene que coincidir exactamente con el valor de `--host`. Si no pasas
`--host`, se usa `sl.urutau-ltd.org:23231`. El puerto forma parte de la clave:
`sl.urutau-ltd.org` y `sl.urutau-ltd.org:23231` son hosts distintos.

### `aliases`

Es un objeto de clave a URL base. El código busca el alias usando el mismo valor
de `--host`, así que la clave tiene que ser igual a la de `hosts`. El valor es
la URL base sin barra final; el cliente le quita la barra si se la dejas.

```json
"aliases": {
    "sl.urutau-ltd.org:23231": "https://sl.urutau-ltd.org"
}
```

Si no hay alias para el host elegido, se usa el valor por defecto
`https://sl.urutau-ltd.org`. Eso significa que agregar otro host sin su alias
manda las peticiones al servidor de Urutaú. Si vas a usar otro Forgejo, agrega
siempre el alias correspondiente.

## Ejemplo con otro servidor

```json
{
    "hosts": {
        "git.example.com": {
            "type": "Application",
            "name": "forge-cli",
            "token": "token-de-ejemplo"
        }
    },
    "aliases": {
        "git.example.com": "https://git.example.com"
    }
}
```

```bash
$ forge-cli --host git.example.com repo-view mi-org/mi-repo
```

## Campos extra

El parser ignora los campos que no conoce. El archivo original de `forgejo-cli`
puede traer `default_ssh` u otras claves; no rompen la lectura. Lo que sí
importa es que `hosts` y `aliases` sean objetos y que cada entrada de `hosts`
tenga `type`, `name` y `token` como strings.

El archivo se lee completo en memoria con un límite de 10 MB. Un JSON inválido o
una entrada incompleta devuelve error antes de hacer cualquier petición.

## Tokens

El token se manda en la cabecera `Authorization` de cada petición. Debe tener
permisos suficientes para las acciones que uses: leer repositorios, crear o
editar issues, comentar, listar etiquetas y abrir pull requests. Un token de
solo lectura sirve para `repo-view`, `issue-search`, `comment-list`,
`label-list`, `milestone-list` y `pr-view`, pero falla en las operaciones de
escritura.

El archivo de claves es tan sensible como el token. Déjalo con permisos
restringidos:

```bash
$ chmod 600 ~/.local/share/forgejo-cli/keys.json
```

No lo agregues a un repositorio ni lo compartas en un chat. Si sospechas que se
filtró, revócalo en Forgejo y genera otro.

## Depuración

Si el comando dice que no encuentra el token:

```text
no token found for host sl.urutau-ltd.org:23231 in /home/tu-usuario/.local/share/forgejo-cli/keys.json
```

Revisa tres cosas: que `--host` sea igual a la clave de `hosts`, que el archivo
exista en la ruta que estás usando y que el JSON sea válido. Si el error es de
parseo, el mensaje suele apuntar al campo que falta.

## Validar el archivo sin tocar la API

Un error de configuración se puede detectar antes de ejecutar un comando:

```bash
$ jq -e '.hosts["sl.urutau-ltd.org:23231"].token' \
    ~/.local/share/forgejo-cli/keys.json > /dev/null
```

Si `jq` falla, el archivo no tiene la forma esperada o la clave no existe. Para
ver las claves de host disponibles:

```bash
$ jq -r '.hosts | keys[]' ~/.local/share/forgejo-cli/keys.json
```

Para ver qué alias tiene cada host:

```bash
$ jq '.aliases' ~/.local/share/forgejo-cli/keys.json
```

## Errores que muerden

### El host no coincide

El cliente no normaliza el nombre. `sl.urutau-ltd.org` y
`sl.urutau-ltd.org:23231` son claves distintas. Si el archivo usa una y el
comando la otra, el error es "no token found".

### El alias no coincide

`aliases` se busca con el mismo valor de `--host`. Si la clave de alias no es
idéntica a la de `hosts`, el cliente usa el base por defecto. En un servidor
distinto, eso manda las peticiones a `sl.urutau-ltd.org`. Siempre duplica la
misma clave en los dos objetos.

### El archivo está en otra ruta

El path por defecto depende de `HOME`. Si ejecutas `forge-cli` desde un servicio
o un contenedor sin `HOME`, el cliente falla antes de leer el archivo. Pasa
`--config` con una ruta absoluta.

### El token no tiene permisos

Un token de solo lectura sirve para listar, pero falla al crear o editar. El
error viene de la API, no del cliente. Revisa los permisos del token en Forgejo
si una operación de escritura devuelve 403.

## Varios hosts

```json
{
    "hosts": {
        "sl.urutau-ltd.org:23231": {
            "type": "Application",
            "name": "urutau",
            "token": "..."
        },
        "git.example.com": {
            "type": "Application",
            "name": "ejemplo",
            "token": "..."
        }
    },
    "aliases": {
        "sl.urutau-ltd.org:23231": "https://sl.urutau-ltd.org",
        "git.example.com": "https://git.example.com"
    }
}
```

Después:

```bash
$ forge-cli --host git.example.com repo-view mi-org/mi-repo
```

El `--host` también se puede exportar en un alias de shell para no repetirlo. No
hay una variable de entorno documentada para el host; usa el flag.
