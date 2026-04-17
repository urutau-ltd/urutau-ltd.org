---
title: "Noticias Guix Tuta (2025-11-10)"
description: Novedades del wrapper para el cliente de correos Tuta en Guix.
date: 2025-11-10
author: "FuncProgLinux"
image: "/posts/news/@/index.png"
draft: false
tags:
    - Noticias
    - Tuta
    - Guix
    - Bash
---

> **IMPORTANTE:** El script que mantenemos en el canal **NO** es un programa o
> distribución oficial de Tuta (Tutao GmbH)

El script `tuta` que mantenemos en el canal
[`nyctibius`](codeberg.org/urutau-ltd/nyctibius) y en su propio
[repositorio](https://codeberg.org/FuncProgLinux/guix-tuta-mail) separado por
fin está disponible como versión estable `v1.0.0`. Te contamos los cambios más
recientes en esta pequeña sección de noticias.

## `tuta` - `v1.0.0`

El script viene con varias mejoras de integración con el escritorio o entorno
gráfico que estés usando. Por defecto se hicieron pruebas utilizando el servidor
gráfico X (Xorg) y el entorno de escritorio MATE. Aquí se listan las mejoras en
el script:

1. Se registraron variables nuevas para mejorar la integración con el
   escritorio:
   - `TUTA_CONF`: Apunta por defecto al directorio registrado en
     `XDG_CONFIG_HOME/tutanota-desktop/` y a `$HOME/.config/tutanota-desktop/`
     en caso de que la variable anterior no esté disponible, esto soluciona el
     error donde el script no persistía las sesiones entre reinicios del
     sistema.
   - `LOG_FILE`: Apunta por defecto hacia
     `$HOME/.var/guix-tuta/tuta-guix-launcher.log` como salida del comando
     `guix shell` contenido en el script de `tuta`

Gracias a estas pequeñas adiciones, además de un par de ajustes al comando
`guix shell` utilizado para crear el contenedor tipo FHS, ahora el lanzador del
AppImage persiste el inicio de sesión entre reinicios y se integra correctamente
con el demonio de notificaciones del sistema.

¡Gracias por leer el blog de Urutaú Limited! 🖤🦉
