---
title: Software
layout: layout.tsx
type: page
---

# Software Libre

En esta página encontrarás una lista de software que vive bajo el ala de esta
organización. Sea a nivel de código, financieramente o simplemente como un
proyecto para _devolver_ algo a la comunidad que tanto nos ha dado por tantos
años.

## Nyctibius

<!-- Guix Nyctibius Channel Logo -->

<img style="width: 100px; height: 100px;"
    src="/img/urutau.png"
    alt="Guix Nyctibius Channel logo"
    loading="lazy"/>

> Licencia: GPLv3.0+

> Desarrollo:
> <chip>Privado</chip>

Nyctibius es el canal privado de Urutaú Limited para GNU Guix y su desarrollo se
realiza dentro de la organización y existe con el propósito de empaquetar
software propio más pequeño, paquetes que no necesariamente sean para todos los
usuarios como herramientas de seguridad escritas en [Go](https://go.dev/) o
versiones actualizadas de bibliotecas como FreeFem.

El canal es privado, **no** privativo. Existe un espejo del mismo en
[Codeberg](https://codeberg.org/urutau-ltd/nyctibius).

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

Aile es una micro biblioteca para Go, escrita encima de `net/http`. Su diseño
busca parecerse a `hono` y `chi`. No es un framework en proceso o algo parecido,
solo es una pequeña capa de abstracción encima de los routers que puedes crear
con `http.NewServeMux(...)`.

Puedes instalarla con el siguiente comando, en tu proyecto de Go:

```bash
$ go get -u codeberg.org/urutau-ltd/aile
```

Aquí tienes un pequeño ejemplo para comenzar:

```go
package main

import (
    "context"
    "log"
    "net/http"
    
    "codeberg.org/urutau-ltd/aile"
)

func main() {
    app, err := aile.New()
    if err != nil {
        log.Fatal(err)
    }
    
    app.Use(aile.Recovery())
    
    app.GET("/", func(w http.ResponseWriter, r *http.Request) {
        aile.Text(w, http.StatusOK, "Nyctibius Griseus")
    })
    
    if err := app.Run(context.Background()); err != nil {
        log.Fatal(err)
    }
}
```

## Gavia

<!-- Urutaú Gavia -->

<img style="width: 100px; height: 100px;"
    src="/img/gavia.png"
    alt="A loon"
    loading="lazy"/>

> Licencia: AGPLv3.0+

> Desarrollo:
> <chip class="ok">Público en
> <a href="https://github.com/urutau-ltd/gavia">GitHub</a></chip>

Gavia es una aplicación web de inventario y monitoreo de activos de
infraestructura, similar a [My Idlers](https://github.com/cp6/my-idlers), con
menos características pero suficientemente completo para poder ser de utilidad
en infraestructura personal/familiar/pequeño emprendimiento.

Todavía se encuentra en estado experimental, por lo que no es posible utilizarlo
de forma productiva. Puedes volver más tarde a ver si hay actualizaciones por
acá respecto a este software :)

---

# Archivo

Aquí se listan los proyectos descontinuados. No volverán a recibir soporte o
atención de nuestra parte.

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

En GNU Guix puedes instalar `icedove`.

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

Las contribuciones ahora se prueban en Nyctibius y ahora contribuimos
directamente con los paquetes en `gnu/packages/mate.scm` en la distribución GNU
Guix.

---
