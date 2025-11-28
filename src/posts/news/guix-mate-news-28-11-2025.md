---
title: "Noticias Guix MATE (2025-11-28)"
description: Noticias del canal del entorno de escritorio MATE.
sample: Novedades en el canal GUIX MATE el día 28 de Noviembre del 2025. Ingresa para conocer las últimas actualizaciones y mejoras del software que tenemos ahí.
date: 2025-11-28
author: "FuncProgLinux"
image: "/posts/news/@/index.png"
draft: false
tags:
    - Noticias
    - MATE
    - Guix
    - Guix-MATE
---

<img style="height: 150px; width: 150px;" src="/img/guix-mate.png"/>

<details>
    <summary>Índice:</summary>
    <!-- Don't forget the newline before and after [[toc]]!!! -->

    [[toc]]

</details>

Antes que nada, muchas gracias a quienes visitan este sitio y consumen su
contenido, es de mi agrado saber que aún existen las personas que disfrutan de
la lectura de bajo presupuesto en este rincón del internet. En este artículo de
noticias, revisaremos los cambios que han ocurrido estas semanas en el canal de
Guix MATE.

## Cambios en los nombres de los módulos

El módulo `guix-mate/packages/ayatana.scm` ha cambiado su nombre a
`guix-mate/packages/ubuntu.scm` si utilizas Guix MATE en tus configuraciones
deberás cambiar tus referencias en tus configuraciones de Scheme:

```scheme
;; Anterior
(use-modules (guix-mate packages ayatana))

; o
(define-module (nombre del modulo)
    #:use-module (guix-mate packages ayatana))

;; Nuevo
(use-modules (guix-mate packages ubuntu))

; o
(define-module (nombre del modulo)
    #:use-module (guix-mate packages ubuntu))
```

## Bibliotecas de Ayatana

Ya tenemos disponibles las bibliotecas actualizadas de los indicadores ayatana
en Guix MATE.

- `libayatana-appindicator`
- `libayatana-indicator` -> `0.9.4` (Nueva versión)
- `libayatana-common`
- `lomiri-api`
- `libqtdbustest`

Las dependencias necesarias para dichas bibliotecas también se encuentran
presentes en el canal:

- `gtest` (Framework de pruebas para C++ desarrollado por Google)
- `cmake-extras` (Extras para la herramienta de construcción `cmake` escritos
  por el proyecto Lomiri)

## Plank

El dock [Plank](https://launchpad.net/plank) ahora se encuentra disponible en
Guix MATE!

<figure>
    <img src="/img/plank.png"/>

    <figcaption>
            Puedes probarlo en la última actualización del canal
            usando el comando <code>$ guix install plank</code>
    </figcaption>

</figure>

Gracias a las dependencias que empaquetamos anteriormente como `bamf` logramos
tener este paquete disponible para los usuarios. En planes futuros estamos
pensando en proveer también un paquete para
[Plank-Reloaded](https://github.com/zquestz/plank-reloaded) el cual es un fork
con diferencias como mejoras en la integración con escritorios como MATE, KDE en
X11, sistema de construcción `meson`, etc. Suscríbete al sitio de Urutaú LTD via
[RSS](/posts.rss) para recibir de inmediato la notificación cuando el mismo esté
disponible.

## Actualizaciones al software de Linux Mint

- `sticky` -> `1.28` (Nueva versión)
- `xed` -> `3.8.5` (Nueva versión)
- `mint-l-icon-theme` -> `1.7.9` (Nueva versión)
- `mint-x-icon-theme` -> `1.7.5` (Nueva versión)
- `mint-y-icon-theme` -> `1.8.9` (Nueva versión)
- `mint-themes` -> `2.3.4`
  - **IMPORTANTE:** La versión no es correcta, la he marcado como una revisión
    menor por que Linux Mint no ha publicado el tag que sigue en GitHub, la
    sección `commit` del paquete de Guix cambió de `(commit "2.3.2")` a la
    última revisión y quedó como `(commit "master.mint22")`

### `libxapp`

Linux Mint liberó hace poco la versión `3.0.0` de `libxapp`, esta actualización
elimina la versión `2.8.12` y actualiza los paquetes que dependían de la misma a
la última revisión publicada:

- `libxapp` -> `3.2.0` (Nueva versión)
- `xed` ahora usa `libxapp-3.2.0`
- `sticky` ahora usa `libxapp-3.2.0`
- `warpinator` ahora usa `libxapp-3.2.0`

Puedes consultar todo el software disponible en nuestro canal o el snippet de
suscripción en [Toys](https://toys.whereis.social/).

¡Gracias por leer el blog de Urutaú Limited! 💜🦉
