---
title: "Noticias Guix MATE (2025-11-05)"
description: Noticias del canal del entorno de escritorio MATE.
date: "2025-11-06"
author: "FuncProgLinux"
layout: "layouts/post.tsx"
draft: false
image: /index.png
tags:
    - Noticias
    - MATE
    - Guix
openGraphLayout: /layouts/og.tsx
---

<img style="height: 150px; width: 150px;" src="/img/guix-mate.png"/>

Para mantener informados a los usuarios del canal (al menos a los
hispanohablantes) se harán publicaciones periódicas en este blog para notificar
de cambios de una manera más extensa y no abusar del mecanismo ofrecido por los
canales en `etc/news.scm`.

## Atril v1.28.2

El visor de documentos `atril` ya se encuentra disponible en su ultima versión
estable (`1.28.2`) con 34 commits nuevos con respecto a su versión anterior
(`1.28.1`), los cuales mejoran el uso y estabilidad del programa bajo el
protocolo Wayland.

## `mate-panel` v1.28.7

El nuevo panel de MATE ahora utiliza `libwnck` en su versión `43.0` (ya
disponible en nuestro canal bajo el nombre `libwnck-next`). Además de contar con
mejoras de funcionamiento en el protocolo Wayland.

Este paquete cuenta con una definición nueva, pues los mantenedores del entorno
de escritorio MATE han reportado problemas para utilizar su mirror FTP en
https://pub.mate-desktop.org por lo que, a partir de ahora los componentes del
escritorio se construirán desde el repositorio `git` que ofrecen en su
organización de [GitHub](https://github.com/mate-desktop).

## `mate-notification-daemon` v1.28.5

Esta nueva versión del demonio de notificaciones contiene mejoras en sus
traducciones, dos parches nuevos que solucionan salidas inesperadas y al igual
que `mate-panel` ahora hace uso de `libwnck` en su versión `43.0`.

## `libmateweather` v1.28.1

Esta versión es una revisión menor que soluciona un bug con la API del clima que
es consultado a través de internet. Es recomendado actualizar, de lo contrario,
puede que, si eres usuario del applet del tiempo, el mismo deje de funcionar
correctamente.

## Nuevo paquete: `bamf`

`bamf` es un marco de trabajo desarrollado por la gente de Canonical (mismos que
trabajan en Ubuntu). Es una dependencia del paquete `mate-dock-applet` ya
disponible pero no usable dentro del canal. Y tenerlo en nuestro arsenal de
paquetes abre la puerta a nuevo software como el dock `plank`.
