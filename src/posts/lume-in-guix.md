---
title: Creando un sitio estático con Lume, Deno y GNU GUIX
description: Cómo creamos y mantenemos este sitio web
date: "2025-10-26"
author: "FuncProgLinux"
tags:
    - Deno
    - TypeScript
    - GNU Software
    - Guix
    - Dev
draft: false
---

Si estás leyendo esto, probablemente nos encontraste en algún otro sitio o
salimos en los resultados de alguna búsqueda que hiciste en tu navegador. Desde
que iniciamos este proyecto, nos ha hecho falta un sitio web, mismo que ha
pasado por una cantidad considerable de borradores y maquetas antes de llegar a
un _mínimo producto viable_. ¿Qué es lo que lo hace especial? Al menos para tu
servidor, escribiendo este artículo, es que la versión productiva está hecha,
mantenida y pensada para trabajarse en [GNU Guix](https://guix.gnu.org/).

## ¿Deno en Guix? ¿Cómo?

GNU Guix es un sistema operativo similar a NixOS y eso implica que, el software
escrito en lenguajes de programación con un esquema de compilación mixto
(enlazado estático y dinámico) tiende a ser particularmente problemático para
distribuirse. Especialmente el software escrito en Rust. El lenguaje no es
particularmente malo, sin embargo su gestor de paquetes sufre del mismo defecto
que `npm`. Dicho defecto es el uso excesivo de dependencias para lograr un
resultado deseado. Por supuesto que esto también es consecuencia de que el
lenugaje opte por un estilo minimalista y portable, lo que hace que cosas como
números aleatorios o serialización de JSON sean posibles únicamente a través de
`crates`.

En Guix, habría que empaquetar **TODAS** las crates necesarias, además de que
los paquetes no deben utilizar _blobs_ que vengan con el software por lo que,
usar una versión de `v8` precompilada está fuera de la mesa. Esto vuelve a Deno
un reto interesante para quien se anime a mantener el paquete en Guix.

> ¿Por qué no simplemente descargas Deno y lo ejecutas en tu Gnu Bash?

Bueno, si fuera así de sencillo no estaría escribiendo esto ¿o si? Vamos a ver
que pasa si intentamos ejecutar el binario oficial de `deno` en Guix sin pasos
extra:

```bash
$ deno
bash: deno: no se puede ejecutar: no se ha encontrado el fichero requerido

$ which deno
/home/fplinux/.deno/bin/deno
```

Extraño ¿verdad? Este error puede confundir a varios principiantes en este tipo
de sistemas operativos, el problema reside en el intérprete
[ELF](https://wiki.osdev.org/ELF) el cual muchos binarios en este tipo de
lenguajes, esperan encontrar en rutas comunes como `/lib` o `/usr/lib`. NixOS
también sufre de este inconveniente. Para este tipo de problemas ellos mismos
desarrollaron la herramienta `patchelf` que está disponible en Guix:

```bash
$ guix search patchelf

name: patchelf
version: 0.18.0
outputs:
+ out: todo
systems: x86_64-linux i686-linux
dependencies: gcc@14.3.0
location: gnu/packages/elf.scm:328:2
homepage: https://nixos.org/patchelf.html
license: GPL 3+
synopsis: Modify the dynamic linker and RPATH of ELF executables
description: PatchELF allows the ELF "interpreter" and RPATH of an ELF binary to be changed.
relevance: 32
```

Esta herramienta nos ayudaría a parchear la ruta hacia el intérprete ELF que
esperan estos binarios, sin embargo no es lo que busco hacer.

La segunda opción que tenemos es utilizar el
[canal nonfree](gitlab.com/nonguix/nonguix), sin embargo, para el propósito de
un solo proyecto, deberíamos volver el repositorio un canal de Guix en si mismo
y no buscabamos eso. Tenía que haber una forma de ejecutar `deno` en Guix
utilizando las herramientas que ya existen y luego de experimentar por horas,
por fin di con ella.

### ¡Guix Shell al rescate!

Afortunadamente en Guix existe un subcomando llamado `shell`. Su propósito es
crear entornos de software _"desechables"_ o de uso específico, algo similar a
los `venv` de Python pero mucho, muchísimo más poderoso. Dichos entornos pueden
ser interactivos o no-interactivos dependiendo de nuestras necesidades.

Aquí es donde encontramos una cosa que necesitamos y es la bandera
`--emulate-fhs` que, como su nombre lo indica, crea un nuevo entorno simulando
un sistema GNU/Linux que sigue el estándar de jerarquía del sistema de archivos
en sistemas comunes. La instalación de `deno` por defecto se realiza siempre en
la ruta `$HOME/.deno/bin/deno` y
[no es posible cambiarla](https://github.com/denoland/deno/issues/2630), no al
menos en la fecha cuando se escribió este artículo. Por lo que, el binario de
`deno` debe estar presente en esta ruta. Para ayudarnos a crear un entorno más
preparado para la ejecución, el subcomando `shell` nos proporciona una bandera
`--export-manifest` para crear un archivo manifiesto donde se listan las
dependencias que usaremos para una shell en específico. Los manifiestos los
podemos usar para ayudar al desarrollo de otros proyectos de software o incluso
para desarrollar software directamente para GNU Guix utilizando sus versiones de
los compiladores/intérpretes/bibliotecas. Vamos a crear un nuevo directorio y
dentro del mismo un manifiesto para invocar una `shell` de guix:

```bash
$ guix shell gcc-toolchain \
    bash \
    coreutils \
    ncurses \
    emacs \
    emacs-evil \
    make \
    perl \
    perl-critic \
    perltidy \
    git \
    podman \
    podman-compose --export-manifest > manifest.scm
    
$ cat manifest.scm
;; Lo que sigue es un "manifest" equivalente a la línea de comando que
;; introdujo. Puede almacenarlo dentro de un archivo que pudiese pasar a
;; cualquier comando 'guix' que acepte una opción '--manifest' (o -m).

(specifications->manifest
  (list "gcc-toolchain"
        "bash"
        "coreutils"
        "ncurses"
        "emacs"
        "emacs-evil"
        "make"
        "perl"
        "perl-critic"
        "perltidy"
        "git"
        "podman"
        "podman-compose"))
```

Para comenzar a usar una shell de desarrollo usando este manifiesto recién
generado, podemos invocar `guix shell` con la opción `-m` y proporcionar una
ruta al archivo manifiesto, por ejemplo: `guix shell -m ./manifest.scm`.

Ahora que tenemos nuestro manifiesto, nos apoyaremos de GNU Makefile para crear
la shell de desarrollo, pues necesitamos de unos ajustes adicionales para poder
utilizar `deno` en Guix y crear el proyecto con Lume. Claro que, enseñarte a
usar `make` está fuera del alcance de este artículo. Aunque, asumo que, si has
llegado al punto de usar GNU Guix como gestor de paquetes o como sistema
operativo principal, ya sabes mucho de lo que hay que saber acerca del software
de GNU. Necesitamos proporcionar a `guix shell` las rutas que deseamos
compartirle, si queremos que `guix` esté disponible dentro del entorno y por
último, aceptar que tenga acceso a la red, pues Lume es un proyecto que utiliza
los módulos de TypeScript remotos que Deno nos permite utilizar. Puedes usar el
siguiente `Makefile` como guía o consultar el código fuente de este proyecto:

```make
# The location of the manifest file for this project
DEV_ENV_MANIFEST="manifest.scm"

USER_HOME = $${HOME}
DENO_BIN_DIR = $(USER_HOME)/.deno/bin

env: ## Starts a development guix shell for this channel
	@echo "==> [LUME/DEV]: Spinning up a development environment..."
	@guix shell --emulate-fhs \
	--container \
	--network \
	--nesting \
	--expose=$(DENO_BIN_DIR) \
	-m $(DEV_ENV_MANIFEST) -- bash -c 'export PATH=$(USER_HOME)/.deno/bin:$$PATH && export TERM=xterm-256color && exec bash'
```

Es importante señalar dos cosas. La primera es que, `--expose=` hará fallar al
comando `guix shell` completamente en caso de que **no** exista el binario de
`deno` en la ruta que indicamos en `DENO_BIN_DIR`. Finalmente, como comando de
inicio invocamos `bash` de forma interactiva cargando el `PATH` apuntado hacia
la ruta del binario de `deno` en nuestro directorio `$HOME`. Si ya añadiste este
objetivo a tu `Makefile` cuando invoques el comando `make dev` deberías obtener
la siguiente salida y el siguiente prompt de `bash`:

```bash
$ make env
==> [LUME/DEV]: Spinning up a development environment...

bash-5.2$
```

Esta `shell` se encuentra dentro del entorno `guix shell` con los paquetes que
cargamos en nuestro archivo `manifest.scm`. Es interactiva y puedes limpiarla
con <kbd>Ctrl</kbd> + <kbd>L</kbd> como normalmente lo harías. Vamos a probar si
nuestro comando para cargar el `deno` presente en nuestro directorio `$HOME`
funcionó correctamente:

```bash
# Comprobemos si deno está en su última versión
bash-5.2$ deno --version
deno 2.5.4 (stable, release, x86_64-unknown-linux-gnu)
v8 14.0.365.5-rusty
typescript 5.9.2

# El comando which no está instalado, pero podemos
# usar command -v tranquilamente.
bash-5.2$ command -v deno
/home/fplinux/.deno/bin/deno

# Podemos observar que estamos en el directorio raíz de nuestro proyecto también
bash-5.2$ pwd
/home/fplinux/src/urutau-ltd.org

bash-5.2$ ls
Makefile LICENSE  README.md  manifest.scm

bash-5.2$
```

Perfecto, ahora que puedes trabajar _en santa paz_ dentro del directorio de tu
proyecto, puedes dirigirte al sitio de [Lume](https://lume.land/) y seguir las
instrucciones de configuración de su sitio.

## Creando un "fallback" con Podman

Toda la tecnología puede fallar y, aunque Guix es una obra de arte a nivel de
ingeniería, es posible que una actualización o un error de nuestra parte pueda
dejarnos sin poder crear una nueva `guix shell`. Afortunadamente, si ya creamos
el proyecto en Lume es posible crear un _Plan B_ para construir nuestro sitio
utilizando `podman` en su lugar. Puedes usar nuestro `Dockerfile` para tomar
inspiración (o hacer el tuyo desde cero):

```dockerfile
# === BUILD STAGE ===
FROM docker.io/denoland/deno:alpine-2.5.4


WORKDIR srv/

COPY . .

RUN apk add make --no-cache && deno install --allow-scripts

ENV TERM=xterm-256color
ENV DENO_NO_UPDATE_CHECK=disable

LABEL org.opencontainers.image.authors="Urutaú Limited"
LABEL org.opencontainers.image.title="urutau-ltd.org"
LABEL org.opencontainers.miage.licenses="AGPL-v3.0+"
LABEL org.opencontainers.image.url=https://sl.urutau-ltd.org/urutau-ltd.org/
LABEL org.opencontainers.image.source=https://sl.urutau-ltd.org/urutau-ltd.org/
LABEL org.opencontainers.image.description="Static site builder image"
LABEL org.opencontainers.image.vendor="Urutaú Limited."
LABEL org.opencontainers.image.version="v1.0.0-first-light"

CMD ["make", "build"]
```

Ten en cuenta que si estás leyendo esto en el futuro es probable que la versión
`2.5.4` ya no sea la última versión estable de Deno, o puede que esté EOL (En
Inglés, siglas para: _End Of Life_) y que dicha versión ya no tenga soporte
alguno, lo cual podría tener consecuencias de funcionamiento o seguridad.

Puedes extender tu archivo `Makefile` para incluir objetivos que te faciliten la
creación de la imágen Docker del proyecto y para ejecutar el constructor
también:

```make
TAG := sl.urutau-ltd.org/urutau-ltd/builder:latest

image: ## Make a builder podman image for this site
	@echo "==> [LUME/PODMAN]: Building podman image..."
	podman build -t $(TAG) .
	@echo "==> [LUME/PODMAN]: Finished building podman image!"

oci-build: ## Builds the site using the image
	@echo "==> [LUME/PODMAN-BUILD]: Building site using the podman image"
	podman run --rm --name="builder" -v ./src:/srv/src -v ./output/:/srv/output $(TAG)
	@echo "==> [LUME/PODMAN-BUILD]: Site finished building!"

push-image: ## Push OCI image to the container registry
	podman push --tls-verify=false $(TAG)
```

Aquí debo hacer énfasis en un objetivo, específicamente en el `oci-build`, los
volúmenes que estamos montando (`src/` y `output/`) podrían no ser los correctos
en tu caso específico. Ambos directorios deberán coincidir con los definidos en
tu archivo de configuración `_config.ts` de Lume:

```typescript
const site: Site = lume({
    src: "./src", // Debe coincidir aquí
    dest: "./output", // y aquí
    watcher: {
        "ignore": [
            "/.git",
        ],
    },
});
```

Puedes probar la construccion de tu sitio con:

```bash
$ make image && make oci-build
==> [LUME/PODMAN]: Building podman image...
podman build -t sl.urutau-ltd.org/urutau-ltd/builder:latest .
STEP 1/15: FROM docker.io/denoland/deno:alpine-2.5.4
# [Salida recortada ...]
Successfully tagged sl.urutau-ltd.org/urutau-ltd/builder:latest
bf87c92bcace73dbc81f61c46b048205e97b3d6d8fd5aa54f26e6b5e445abc22
==> [LUME/PODMAN]: Finished building podman image!
==> [LUME/PODMAN-BUILD]: Building site using the podman image
podman run --rm --name="builder" -v ./src:/srv/src -v ./output/:/srv/output sl.urutau-ltd.org/urutau-ltd/builder:latest
==> [LUME/DEV]: Building lume site...
Task build deno task lume
Task lume deno run -P=lume lume/cli.ts
# [Salida recortada ...]
🍾 Site built into ./output
  38 files generated in 7.28 seconds
==> [LUME/DEV]: Finished building lume site...
==> [LUME/PODMAN-BUILD]: Site finished building!
```

Los archivos deberían estar presentes en tu directorio de salida ahora.

Este artículo apenas y rasca la superficie de lo que puedes hacer con Guix y
`guix shell`, es posible crear entornos de desarrollo con paquetes no dispoibles
en los repositorios oficiales de la distribución, usar versiones actualizadas
exclusivas para el entorno y mucho más. Si estás interesad@ en Guix te
recomiendo mucho que visites su [sitio web](https://guix.gnu.org) o si ya eres
usuari@ de GNU Guix, que revises la
[documentación de guix shell](https://guix.gnu.org/manual/devel/en/html_node/Invoking-guix-shell.html).
Podrías explorar la cantidad de opciones que tiene la herramienta y pensar en
nuevas soluciones para que lleguen más usuarios a Guix. Nos vemos luego, espero
hayas disfrutado leyendo este artículo :)

# Fin.
