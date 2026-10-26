---
title: vite-plugin-librejs - Funcionamiento
description: Cómo aplica el plugin los comentarios, las web labels y el enlace de licencia.
wiki_project: vite-plugin-librejs
---

El plugin trabaja en dos hooks de Vite: `generateBundle` y `transformIndexHtml`.
No hay un paso posterior ni un script que haya que ejecutar aparte.

## 1. Comentarios inline

Durante `generateBundle`, el plugin recorre los chunks emitidos y envuelve cada
archivo `.js`, `.mjs` o `.cjs`:

```js
// @license magnet:?xt=urn:btih:0b31508aeb0634b347b8270c7bee4d411b5d4109&dn=agpl-3.0.txt AGPL-3.0-or-later
// @source https://example.com/src/main.js
(() => {
    /* código minificado */
})();
// @license-end
```

El bloque se agrega en `generateBundle`, no en `renderChunk`, porque en Vite 8
con Rolldown el minificador corre después de `renderChunk` y borra los
comentarios. Mutar `chunk.code` en `generateBundle` llega al archivo final.

El `@source` solo aparece si hay una fuente resuelta: `sourceBase` o
`chunks[].source`. Para licencias copyleft conviene incluirlo; para MIT o CC0
puede no ser necesario.

El plugin no inspecciona el contenido del chunk ni decide si el código es libre.
Solo etiqueta lo que Vite emite.

## 2. Página de web labels

Si `weblabels` está activo, el mismo hook emite un asset HTML en
`weblabelsPath`:

```html
<table id="jslicense-labels1">
    <tr>
        <td><a href="../assets/main-A1b2.js">main-A1b2.js</a></td>
        <td>
            <a href="https://www.gnu.org/licenses/agpl-3.0.html">
                GNU Affero General Public License version 3 or later
            </a>
        </td>
        <td><a href="https://example.com/src/main.js">main.js</a></td>
    </tr>
</table>
```

Cada fila tiene tres columnas: el script servido, la licencia y la fuente. La
tercera columna queda vacía si no hay `source`.

Los enlaces de la tabla son relativos a la página de web labels, no a la raíz
del sitio. Eso permite mover `weblabelsPath` a un subdirectorio sin romper los
enlaces. Las filas se ordenan por el nombre del archivo.

La página se genera con texto fijo en inglés y `lang="en"`. `licensePageTitle`
cambia el `<title>`, el `<h1>` y el texto del enlace, pero no traduce la
descripción de la tabla.

## 3. Enlace de descubrimiento

En `transformIndexHtml`, el plugin agrega al `<body>` de cada página:

```html
<a
    href="../about/javascript.html"
    rel="jslicense"
    style="font-size:0.8em;opacity:0.7"
>
    JavaScript license information
</a>
```

`rel="jslicense"` es lo que usa LibreJS para encontrar la tabla. El `href` es
relativo a la página HTML, así que funciona con salidas anidadas.

En modo desarrollo, Vite también ejecuta `transformIndexHtml`, pero no los hooks
de bundle. Resultado: la página servida lleva el enlace, pero no hay comentarios
nuevos ni página de web labels. Eso es intencional; el plugin es de build.

## Resolución de metadata por chunk

Para cada chunk, el orden es:

1. Buscar un override en `chunks` por `fileName` exacto; si no, por
   `chunk.name`.
2. Resolver el SPDX: `chunks[].license` o el `license` global.
3. Resolver el magnet: `chunks[].magnet`, la tabla incorporada o el `magnet`
   global si el chunk sigue usando la licencia global.
4. Resolver la fuente: `chunks[].source` o `sourceBase`.

La consecuencia práctica:

- `license` es el default.
- `chunks` es la salida de emergencia para dependencias con otra licencia.
- Una licencia desconocida en un override necesita su propio magnet.
- Un `fileName` exacto gana sobre un `chunk.name`.

## Compatibilidad

| Vite | Estado     |
| ---- | ---------- |
| 6.x  | Soportado. |
| 7.x  | Soportado. |
| 8.x  | Soportado. |

El plugin importa `OutputBundle`, `OutputChunk`, `OutputAsset` y
`NormalizedOutputOptions` desde el namespace de tipos que Vite reexporta. No
importa Rolldown directamente; Rolldown es una dependencia transitiva de Vite.

## Detalles que solo se ven en la salida

- Si no hay chunks de JavaScript, el plugin no emite la página de web labels. El
  hook retorna antes de escribir el asset cuando la lista queda vacía.
- Los comentarios se agregan a todos los chunks, incluidos los de vendors. No
  hay una lista de exclusión.
- El plugin tampoco deduplica comentarios: si otro paso ya puso un `@license`,
  el chunk termina con dos bloques. Eso no rompe LibreJS, pero ensucia la
  salida.
- `@source` solo aparece si hay una fuente resuelta. Un chunk sin `sourceBase`
  ni `chunks[].source` queda con el bloque de licencia y nada más.
- El enlace del HTML y las filas de la tabla usan rutas relativas. Si sirves el
  sitio desde un subdirectorio, los enlaces siguen funcionando.
- La página de labels se genera en inglés y con `lang="en"`. El título se puede
  cambiar; el resto del texto no.

## Qué no toca

- No procesa los archivos fuente `.ts`, `.tsx` o `.jsx`; trabaja sobre los
  chunks emitidos.
- No cambia el código ni elimina funcionalidad.
- No valida que la URL de `source` exista.
- No genera una página en español ni traduce etiquetas.
- No reemplaza una revisión legal de las licencias de tus dependencias.
