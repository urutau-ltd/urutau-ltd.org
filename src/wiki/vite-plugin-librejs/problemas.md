---
title: vite-plugin-librejs - Problemas
description: Errores comunes del plugin y cómo diagnosticarlos.
wiki_project: vite-plugin-librejs
---

La mayoría de los problemas caen en tres grupos: una licencia que el plugin no
conoce, una URL de fuente que no corresponde o una página que LibreJS no
descubre. Esta página va por partes.

## La build falla al crear el plugin

```text
[vite-plugin-librejs] License "X" is not in the built-in map.
Supply a "magnet" URI in the plugin options.
Reference: https://www.gnu.org/software/librejs/manual/html_node/Free-Licenses-Detection.html
```

El `license` global no está en la tabla. Pasa el magnet canónico:

```ts
librejsPlugin({
    license: "EUPL-1.2",
    magnet:
        "magnet:?xt=urn:btih:e4ae48d8b484fce88a6cf1d33d4a4bfcbc1fdcf1&dn=eupl-1.2.txt",
});
```

Si el identificador es uno de los antiguos (`GPL-3.0`, `AGPL-3.0`, etc.),
también se acepta, pero conviene migrar a `-only` o `-or-later`.

## La build falla por un chunk

```text
[vite-plugin-librejs] Chunk "assets/vendor-xxxx.js" declares unsupported license "X".
Supply "chunks.assets/vendor-xxxx.js.magnet" (or "chunks.vendor.magnet") to define the LibreJS magnet URI.
```

Un override de `chunks` usa una licencia que el plugin no conoce. El magnet
global no se hereda a propósito: sería metadata de otra licencia. Agrega el
magnet en ese chunk:

```ts
chunks: {
    vendor: {
        license: "EUPL-1.2",
        magnet: "magnet:?xt=urn:btih:...",
    },
}
```

## Las URLs de fuente no son las que esperaba

`sourceBase` genera la URL con `chunk.name`, no con el nombre final que lleva el
hash. Si tu salida es `assets/main-A1b2.js`, el `@source` sigue siendo
`https://example.com/src/main.js`. Si el mapa real es otro, usa
`chunks[].source`:

```ts
chunks: {
    main: {
        source: "https://example.com/src/main.ts",
    },
}
```

Recuerda que la URL tiene que existir. El plugin no comprueba que el servidor la
sirva.

## LibreJS no detecta la página

Revisa en este orden:

1. `injectLicenseLink` está en `true` o agregaste el `<a rel="jslicense">` a
   mano.
2. `weblabels` está en `true` o la página existe en la ruta esperada.
3. El `href` del enlace apunta a la página correcta en el sitio desplegado.
4. Ningún proxy, CDN o transformación de HTML está reescribiendo el enlace.
5. La página de web labels se sirve con `text/html` y no con otro content type.

Si desactivaste los tres mecanismos, LibreJS no tiene forma de saber que el
código es libre.

## Los enlaces relativos cambian según la página

Es intencional. El plugin calcula la ruta desde cada HTML hasta `weblabelsPath`.
Una página en `/docs/guia/` y otra en `/` van a tener `href` distintos. Si
moviste la página de web labels, revisa que `weblabelsPath` siga siendo la ruta
real dentro de `outDir`.

## En desarrollo no aparecen los comentarios

El plugin es de build. En `vite dev`, `transformIndexHtml` agrega el enlace,
pero `generateBundle` no corre, así que no hay comentarios nuevos ni página de
web labels. Prueba con `vite build` y sirve el contenido de `dist/`.

## No funciona con mi versión de Vite

El soporte declarado es Vite 6, 7 y 8. En Vite 5 o anterior, los hooks y los
tipos pueden no coincidir. Si estás en Vite 8 con Rolldown, el plugin ya usa
`generateBundle` para esquivar el minificador; si ves comentarios borrados,
revisa que no haya otro plugin ejecutándose después y mutando `chunk.code`.

## La página de web labels está en inglés

La tabla y la descripción se generan con texto fijo en inglés.
`licensePageTitle` solo cambia el título, el encabezado y el texto del enlace.
Si necesitas una página completamente en español, usa `generateWeblabelsHtml`
como base y reemplaza el HTML, o escribe tu propia página con la tabla
`jslicense-labels1`.

## ¿Por qué comentarios y web labels a la vez?

Porque LibreJS acepta las dos formas y los sitios reales son desprolijos. Los
comentarios son directos; la tabla es un respaldo cuando un proxy borra
comentarios o cuando el script se sirve desde otro lugar. Hacer las dos cosas es
la opción con más respaldo.

## La build funciona pero el HTML no tiene el enlace

`transformIndexHtml` solo se ejecuta sobre páginas HTML que Vite procesa. Si
generas HTML fuera de Vite, o si tu framework no pasa por ese hook, el enlace no
aparece. En ese caso agrégalo en tu plantilla o usa la API programática para
generar la página de labels.
