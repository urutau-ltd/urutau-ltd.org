---
title: Bellbird - Instalación
description: Requisitos, compilación y empaquetado de Bellbird.
wiki_project: Bellbird
---

Bellbird está escrito en Go. El módulo declara Go 1.25, así que necesitas un
toolchain igual o más nuevo. El desarrollo del proyecto usa GNU Guix, pero no es
obligatorio para compilar.

## Desde un checkout

```bash
$ git clone https://codeberg.org/urutau-ltd/bellbird.git
$ cd bellbird
$ make build
```

El binario queda en `build/bell`. Si prefieres no usar `make`:

```bash
$ go build -trimpath -o build/bell ./cmd/bellbird
```

## Verificar la versión

```bash
$ bell version
```

El subcomando imprime versión, tag, commit, fecha de build, versión de Go y el
repositorio de origen. `make build` inyecta esos valores con `-ldflags`; una
compilación directa con `go build` muestra `dev` en la mayoría de los campos.

## Pruebas

```bash
$ make fmt
$ make vet
$ make test
$ make test-race
$ make ci
```

`make ci` encadena formato, vet, tests y tests con race detector. El race
detector necesita `gcc` y `CGO_ENABLED=1`; el `Makefile` lo detecta y salta esa
parte si no encuentra un compilador de C.

Para probar el flujo completo sin salir de la máquina:

```bash
$ make e2e
```

Ese target compila y ejecuta `bell selftest`. También puedes correr
`./build/bell selftest` si ya tienes el binario.

## GNU Guix

El repositorio trae `manifest.scm` y `guix.scm`.

```bash
$ make env
```

Abre un shell con Go, `gopls`, `govulncheck`, `staticcheck`, Podman, `make` y
`gcc-toolchain`. Dentro de ese shell, `make build` y `make test` usan el
toolchain de Guix.

Para comprobar el paquete:

```bash
$ make pkg
```

Ese target ejecuta `guix build -f ./guix.scm`.

## Podman

El proyecto tiene un pipeline local para no depender de los runners de Codeberg:

```bash
$ make pipeline
$ make pipeline-ci
$ make pipeline-build
$ make pipeline-e2e
$ make pipeline-verify
```

El pipeline usa `Containerfile.ci`, cachea módulos y artefactos en
`.cache/pipeline/` y permite cambiar la imagen con `PIPELINE_IMAGE`. Está
pensado para ejecutarse en local; no reemplaza a `make ci` cuando estás
iterando.

## Un detalle sobre el nombre del binario

Hay dos nombres en juego:

- `make build` produce `build/bell`.
- `go install .../cmd/bellbird` produce `bellbird`.

Los ejemplos de esta wiki usan `bell`. Si instalas el binario largo, cambia el
nombre en los comandos. Los mensajes de `pgrep` para recargar la política
también cambian: `pgrep '^bell$'` frente a `pgrep '^bellbird$'`.
