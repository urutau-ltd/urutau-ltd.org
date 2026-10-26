---
title: Software
description: Catálogo resumido del software mantenido por Urutaú Limited, con enlaces a su documentación.
layout: layout.tsx
type: page
---

# Software Libre

En esta página encontrarás una lista de software que vive bajo el ala de esta
organización. Sea a nivel de código, financieramente o simplemente como un
proyecto para _devolver_ algo a la comunidad que tanto nos ha dado por tantos
años.

Los repositorios públicos tienen un espejo en nuestro servidor Forgejo en
https://sl.urutau-ltd.org/

La documentación pública de los proyectos se mantiene en la [wiki](/wiki/). Esta
página queda como catálogo resumido.

## Nyctibius

<!-- Guix Nyctibius Channel Logo -->

<img style="width: 100px; height: 100px;"
    src="/img/urutau.png"
    alt="Guix Nyctibius Channel logo"
    loading="lazy"/>

> Licencia: GPLv3.0+

> Desarrollo:
> <chip>Privado</chip>

Nyctibius es el canal interno de Urutaú Limited para GNU Guix. Se usa para
empaquetar herramientas propias, utilidades de seguridad y versiones
actualizadas de algunas bibliotecas. El canal y su documentación son privados:
no hay espejo público ni wiki pública.

## Aile

<!-- Urutaú Aile -->

<img style="width: 100px; height: 100px;"
    src="/img/aile.png"
    alt="Aile from Megaman ZX"
    loading="lazy"/>

<small>La imágen del proyecto no es nuestra. Por favor refiere a la página de
<a href="/libre-licenses">Licencias</a> para leer acerca del copyright de la
misma.</small>

> Licencia: AGPLv3.0+

> Desarrollo:
> <chip class="ok">Público en
> <a href="https://codeberg.org/urutau-ltd/aile">Codeberg</a></chip>
> <chip class="info">Espejo en:
> <a href="https://github.com/urutau-ltd/aile">GitHub</a></chip>

Aile es una micro biblioteca para Go, escrita encima de `net/http`, con una idea
cercana a `hono` y `chi` pero sin intentar convertirse en un framework grande.

La documentación viva de este proyecto ahora vive en su
[wiki dedicada](/wiki/aile/).

## Vexilo

<!-- Urutaú Vexilo -->

<img style="width: 100px; height: 100px;"
    src="/img/vexilo.png"
    alt="A group of feathers"
    loading="lazy"/>

> Licencia: AGPLv3.0+

> Desarrollo:
> <chip class="ok">Público en
> <a href="https://codeberg.org/urutau-ltd/vexilo">Codeberg</a></chip>
> <chip class="info">Espejo en:
> <a href="https://github.com/urutau-ltd/vexilo">GitHub</a></chip>

Vexilo es una biblioteca de mecánicas para escribir aplicaciones web con `aile`
y [HTMX](https://htmx.org/), enfocada en paneles CRUD con vista partida de lista
y editor.

La documentación viva de este proyecto ahora vive en su
[wiki dedicada](/wiki/vexilo/).

## forge-cli

<img style="width: 100px; height: 100px;"
    src="/img/forge-cli-logo.png"
    alt="A hammer hitting an anvil"
    loading="lazy"/>

<small>
Gráfico vectorial tomado de
    <a
    href="https://www.flaticon.es/iconos-gratis/fragua"
    title="fragua iconos">
            Fragua iconos creados por Iconjam - Flaticon
    </a>
</small>

> Licencia: GPLv3.0+

> Desarrollo:
> <chip class="ok">Público en
> <a href="https://codeberg.org/urutau-ltd/forge-cli">Codeberg</a></chip>
> <chip class="info">Espejo en:
> <a href="https://github.com/urutau-ltd/forge-cli">GitHub</a></chip>

forge-cli es un cliente de línea de comandos para Forgejo, escrito en Zig. Lee
el archivo de configuración de `forgejo-cli` y cubre la consulta de
repositorios, issues, comentarios, etiquetas, hitos y pull requests.

La documentación viva de este proyecto ahora vive en su
[wiki dedicada](/wiki/forge-cli/).

## vite-plugin-librejs

<img style="width: 150px; height: 100px;"
    src="/img/vite-logo.png"
    alt="A purple thunder surrounded by white parentheses"
    loading="lazy"/>

<small>
Logo de Vite, propiedad del proyecto Vite. Utilizada únicamente
con propósitos ilustrativos.
</small>

> Licencia: AGPLv3.0+

> Desarrollo:
> <chip class="ok">Público en
> <a href="https://codeberg.org/urutau-ltd/vite-plugin-librejs">Codeberg</a></chip>
> <chip class="info">Espejo en:
> <a href="https://github.com/urutau-ltd/vite-plugin-librejs">GitHub</a></chip>

vite-plugin-librejs es un plugin de Vite que agrega la metadata de licencias que
GNU LibreJS necesita: comentarios `@license`, una página de web labels y el
enlace `rel="jslicense"`. Está publicado en JSR.

La documentación viva de este proyecto ahora vive en su
[wiki dedicada](/wiki/vite-plugin-librejs/).

## Bellbird

<!-- Urutaú Vexilo -->

<img style="width: 100px; height: 100px;"
    src="/img/bellbird.png"
    alt="A group of feathers"
    loading="lazy"/>

> Licencia: GPLv3.0+

> Desarrollo:
> <chip class="ok">Público en
> <a href="https://codeberg.org/urutau-ltd/bellbird">Codeberg</a></chip>
> <chip class="info">Espejo en:
> <a href="https://github.com/urutau-ltd/bellbird">GitHub</a></chip>

Bellbird es un proxy SOCKS5 que usa criptografía postcuántica, incluye un
jitter, inyección de paquetes dummy, y normalización de tamaño de frames para
resistir el análisis de tráfico. La idea está inspirada en `DAITA` de Mullvad.

La documentación viva de este proyecto ahora vive en su
[wiki dedicada](/wiki/bellbird/).

---

## Archivo

Aquí se listan los proyectos descontinuados. No volverán a recibir soporte o
atención de nuestra parte.

## Gavia

<!-- Urutaú Gavia -->

<img style="width: 100px; height: 100px;"
    src="/img/gavia.png"
    alt="A loon"
    loading="lazy"/>

> Licencia: AGPLv3.0+

> Desarrollo:
> <chip class="bad">DESCONTINUADO</chip>

Gavia fue una aplicación web de inventario y monitoreo de activos de
infraestructura, similar a [My Idlers](https://github.com/cp6/my-idlers). El
proyecto ya no recibe soporte ni actualizaciones.

## `guix-tuta-mail`

<!-- Guix Tuta AppImage Wrapper Logo -->

<img style="width: 100px; height: 100px;"
    src="/img/guix-tuta.png"
    alt="Guix Tutanota AppImage wrapper logo"
    loading="lazy"/>

> Licencia: GPLv3.0+

> Desarrollo:
> <chip class="bad">DESCONTINUADO</chip>

Este proyecto ha sido descontinuado. Tuta ahora permite usar extensiones de
Thunderbird para tener todos tus correos en un solo programa.

En GNU Guix puedes instalar `icedove`, compilar Thunderbird desde fuentes o
instalar Thunderbird desde flatpak.

---

## Guix MATE

<!-- Guix MATE Channel Logo -->

<img style="width: 100px; height: 100px;"
    src="/img/guix-mate.png"
    alt="Guix MATE Channel logo"
    loading="lazy"/>

> Licencia: GPLv3.0+

> Desarrollo:
> <chip class="bad">DESCONTINUADO</chip>

Las contribuciones se prueban en Nyctibius y ahora contribuimos directamente con
los paquetes en `gnu/packages/mate.scm` en la distribución GNU Guix, este canal
ya no es necesario.

---
