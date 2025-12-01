---
title: "Noticias Nyctibius (2025-11-05)"
description: Noticias del canal Nyctibius.
sample: Descontinuación de GUIX MATE ¡Larga vida a Nyctibius Griseus!
date: 2025-12-01
author: "FuncProgLinux"
image: "/posts/news/@/index.png"
draft: false
tags:
    - Noticias
    - MATE
    - Guix
    - Guix-MATE
    - Nyctibius
---

<figure>
    <img class="urutau-logo" style="height: 150px; width: 150px;" src="/img/urutau.png"/>
    <figcaption>
            A partir de ahora la imágen que apreciarás al recibir noticias del
            software que mantenemos será la del logo de Urutaú LTD.
    </figcaption>
</figure>

<details>
    <summary>Índice:</summary>
    <!-- Don't forget the newline before and after [[toc]]!!! -->

    [[toc]]

</details>

## Anunciando la descontinuación oficial de GUIX MATE

<img style="height: 150px; width: 150px;" src="/img/guix-mate.png"/>

La historia del canal no es larga, se remonta a inicios de este año 2025 cuando
deseaba contribuir parches de vuelta a GNU Guix en mi entorno de escritorio
favorito, siendo un ex-usuario de distribuciones GNU/Linux tradicionales, me
acostumbré a trabajar con el renovado
[GNOME 2](https://en.wikipedia.org/wiki/GNOME_2) y al ver que el mismo se
encontraba en un estado incompleto decidí intentar enviar parches hacia
_upstream_ para que otros usuarios se vieran beneficiados también.

El canal tuvo un inicio bastante intermitente, hubo meses enteros en los que no
recibió actualizaciones por un mal diseño de mi parte donde el flujo del
software era:

```text
Configuracion Personal --> GUIX MATE -->  Guix
```

Más tarde decidí utilizar mi propio canal de manera local y solo así se volvió
más fácil probar los cambios para poder solucionar errores que hasta la fecha no
habían sido solucionados, gracias a esto el canal pudo contribuir de vuelta 9
parches que incluyen

- [Solucionar el error donde `pluma` no mostraba el resaltado de código fuente ni plugins](https://codeberg.org/guix/guix/pulls/3733)
- [Actualizar el paquete `mate-themes` a su versión `3.22.26`](https://codeberg.org/guix/guix/pulls/3724)
- [Añadir los bindings de Python para `libxapp`](https://codeberg.org/guix/guix/pulls/584)
- [Añadir capacidades de Python al manejador de archivos `caja`](https://codeberg.org/guix/guix/pulls/1965)
- [Añadir el `mate-notification-daemon` que no estaba presente en Guix](https://codeberg.org/guix/guix/pulls/2454)
- [Añadir el applet de indicadores de MATE](https://codeberg.org/guix/guix/pulls/3199)
- [Actualizar el lector de documentos `atril` a su versión `1.28.1`](https://codeberg.org/guix/guix/pulls/3037)
- [Actualizar el gestor de archivadores `engrampa` a su versión `1.28.2`](https://codeberg.org/guix/guix/pulls/2811)
- [Añadir el applet de sensores faltantes](https://codeberg.org/guix/guix/pulls/2766)

Sumado a esto se trabajó en solucionar un error presente desde hacía varios años
(al menos, se que está documentado como un error desde el año 2022), donde los
applets no estaban disponibles, volviendo el paquete `mate-applets` 100%
inservible.

Sin embargo, debido a la (casi) nula respuesta en dicho
[error de `mate-applets`](https://codeberg.org/guix/guix/issues/1616) y
desinterés por parte de los revisores en los parches enviados para renovar el
entorno de escritorio para la versión `1.5.0` de Guix, decidí dejar de enviar
parches hacia la distribución principal y meditar acerca del sentido del canal
GUIX MATE.

El segundo canal `nyctibius` estaba siendo desarrollado en el mismo lugar donde
se desarrolla el sitio de Urutaú LTD. Pero no recibía actualizaciones constantes
y ya llevaba tiempo atrasando planes que tenía en el mismo.

Por lo que, decidí finalmente migrar todos los paquetes y servicios de GUIX MATE
al canal Nyctibius desde el día 1 de Diciembre del año 2025. Esto **no** quiere
decir que el software presente en GUIX MATE pasará a estar sin mantenimiento,
quiere decir que cambió de repositorio de software.

## Sobre Nyctibius

A diferencia de GUIX MATE, este nuevo canal se desarrolla en privado, lo que
quiere decir que, a pesar de que el código fuente sea público, las peticiones de
paquetes, errores y planificación ocurren en privado, debido a que ahora también
se mantendrán paquetes de interés personal en dicho canal.

Si estabas utilizando paquetes de GUIX MATE, solo deberás cambiar la entrada de
Guix MATE en tu archivo `/etc/channels.scm` o `$HOME/.config/guix/channels.scm`:

```scheme
;; Cambia esto
(channel
    (name 'guix-mate)
    (branch "main")
    (url (string-append "file://"
    (getenv "HOME") "/src/guix-mate")))

;; Por esto
(channel
    (name 'nyctibius)
    (branch "stable")
    (url (string-append "file://"
    (getenv "HOME") "/src/nyctibius")))
```

o si prefieres usarlo de forma remota:

```scheme
;; Si quieres usar el mirror de GitHub
(channel
    (name 'nyctibius)
    (branch "stable")
    (url "https://github.com/FuncProgLinux/nyctibius")
    
;; Si quieres usar el mirror de Codeberg
(channel
    (name 'nyctibius)
    (branch "stable")
    (url "https://codeberg.org/urutau-ltd/nyctibius")
```

Todos los programas hasta la fecha han mantenido la misma notación y nombre de
módulos de Guile Scheme. Solo deberás cambiar todas tus sentencias
`(use-modules)` o `#:use-module ()` en tus configuraciones de GUIX:

```scheme
;; Cambia todos estos
(use-modules (guix-mate packages mate))

; o
(define-module (mi-modulo)
    #:use-module (guix-mate packages mate))

;; Por estos
(use-modules (nyctibius packages mate))

; o

(define-module (mi-modulo)
    #:use-module (nyctibius packages mate))
```

Si eras/eres usuario de GUIX MATE los mismos programas estarán disponibles
además de algunos extras para seguridad informática del lado de DevOps.

¡Gracias por leer el blog de Urutaú Limited! 💜🦉
