---
title: vite-plugin-librejs - Opciones
description: Referencia de LibreJSOptions y de las licencias incorporadas.
wiki_project: vite-plugin-librejs
---

La función `librejsPlugin` recibe un objeto `LibreJSOptions`. Solo `license` es
obligatorio; el resto tiene valores por defecto razonables.

```ts
interface LibreJSOptions {
    license: string;
    magnet?: string;
    sourceBase?: string;
    weblabelsPath?: string;
    inlineComments?: boolean;
    weblabels?: boolean;
    injectLicenseLink?: boolean;
    licensePageTitle?: string;
    chunks?: Record<string, ChunkLicense>;
}

interface ChunkLicense {
    license?: string;
    magnet?: string;
    source?: string;
}
```

## Decisión rápida

| Si tu caso es...                               | Usa...                                      |
| ---------------------------------------------- | ------------------------------------------- |
| Una licencia para todo el bundle               | `license` y, si es copyleft, `sourceBase`.  |
| Un chunk de una dependencia con otra licencia  | `chunks[].license` y `chunks[].source`.     |
| Una licencia que no está en la tabla           | `magnet` global o `chunks[].magnet`.        |
| Solo quieres la tabla, sin comentarios         | `inlineComments: false`.                    |
| La página de labels va en un subdirectorio     | `weblabelsPath`.                            |
| El nombre del chunk no sirve como fuente       | `chunks[].source`.                          |
| Quieres desactivar el enlace de descubrimiento | `injectLicenseLink: false` (y agrégalo tú). |

## Opciones generales

| Opción              | Default                          | Qué hace                                                     |
| ------------------- | -------------------------------- | ------------------------------------------------------------ |
| `license`           | obligatorio                      | Identificador SPDX que se aplica a todos los chunks.         |
| `magnet`            | ninguno                          | Magnet de LibreJS para una licencia que no está en la tabla. |
| `sourceBase`        | ninguno                          | Base para generar `@source` a partir del nombre del chunk.   |
| `weblabelsPath`     | `about/javascript.html`          | Ruta de la página de web labels, relativa a `outDir`.        |
| `inlineComments`    | `true`                           | Inyecta los comentarios `@license` en los chunks.            |
| `weblabels`         | `true`                           | Emite la página `jslicense-labels1`.                         |
| `injectLicenseLink` | `true`                           | Agrega el enlace `rel="jslicense"` al HTML.                  |
| `licensePageTitle`  | `JavaScript license information` | Texto del enlace, del `<title>` y del `<h1>`.                |
| `chunks`            | `{}`                             | Overrides por chunk.                                         |

## `license`

Es el SPDX por defecto. Ejemplos:

```ts
librejsPlugin({ license: "AGPL-3.0-or-later" });
librejsPlugin({ license: "GPL-3.0-or-later" });
librejsPlugin({ license: "MIT" });
librejsPlugin({ license: "Apache-2.0" });
```

Si el identificador no está en la tabla incorporada y no pasas `magnet`, el
plugin lanza un error al crearse, antes de que Vite empiece a escribir archivos.
Ese fallo temprano es intencional: una build con metadata incorrecta es peor que
una build que no sale.

## `magnet`

LibreJS identifica la licencia por el info-hash SHA-1 que va dentro del magnet,
no por el texto del SPDX. Para una licencia fuera de la tabla:

```ts
librejsPlugin({
    license: "EUPL-1.2",
    magnet:
        "magnet:?xt=urn:btih:e4ae48d8b484fce88a6cf1d33d4a4bfcbc1fdcf1&dn=eupl-1.2.txt",
});
```

El magnet tiene que ser el canónico de LibreJS. Los de la tabla incorporada
salen de la
[documentación de detección de licencias](https://www.gnu.org/software/librejs/manual/html_node/Free-Licenses-Detection.html).

## `sourceBase`

Genera un `@source` automático:

```ts
librejsPlugin({
    license: "AGPL-3.0-or-later",
    sourceBase: "https://example.com/src/",
});
```

Para un chunk llamado `main`, la URL queda `https://example.com/src/main.js`. El
plugin usa `chunk.name`, no el nombre final con hash. Si tu mapa de fuentes no
coincide, usa `chunks[].source`.

## `weblabelsPath`

Ruta de salida relativa a `outDir`:

```ts
librejsPlugin({
    license: "MIT",
    weblabelsPath: "legal/javascript.html",
});
```

El plugin calcula los enlaces relativos desde esa ruta, así que puede vivir en
subdirectorios sin asumir que todo está en la raíz.

## Toggles

### `inlineComments`

```ts
librejsPlugin({
    license: "MIT",
    inlineComments: false,
});
```

Desactiva solo los comentarios. La página de web labels y el enlace pueden
seguir activos.

### `weblabels`

```ts
librejsPlugin({
    license: "MIT",
    weblabels: false,
});
```

No emite la página. LibreJS solo puede descubrir la licencia por los comentarios
inline o por un enlace que agregues tú.

### `injectLicenseLink`

```ts
librejsPlugin({
    license: "MIT",
    injectLicenseLink: false,
});
```

No agrega el `<a rel="jslicense">`. Si desactivas esto y también `weblabels`, no
queda ningún mecanismo de descubrimiento.

## `licensePageTitle`

```ts
librejsPlugin({
    license: "MIT",
    licensePageTitle: "Licencias del JavaScript",
});
```

Se usa en tres lugares: el texto del enlace inyectado, el `<title>` de la página
y su `<h1>`. No cambia el contenido de la tabla.

## `chunks`

Permite que un chunk declare otra licencia, otro magnet u otra fuente:

```ts
librejsPlugin({
    license: "AGPL-3.0-or-later",
    sourceBase: "https://example.com/src/",
    chunks: {
        vendor: {
            license: "MIT",
            source: "https://registry.npmjs.org/some-dep/-/some-dep-1.0.0.tgz",
        },
    },
});
```

La clave puede ser el `chunk.name` lógico (`vendor`) o el `fileName` final
(`assets/vendor-Bca12345.js`). Si existen las dos, gana el `fileName` exacto.
Cada override puede cambiar `license`, `magnet` y `source` por separado.

Si un override declara una licencia que no está en la tabla y no trae su propio
`magnet`, el plugin falla. No hereda el magnet global, porque eso produciría
metadata de otra licencia.

## Licencias incorporadas

| SPDX                | Nombre                                                 |
| ------------------- | ------------------------------------------------------ |
| `AGPL-3.0-only`     | GNU Affero General Public License version 3            |
| `AGPL-3.0-or-later` | GNU Affero General Public License version 3 or later   |
| `GPL-2.0-only`      | GNU General Public License version 2                   |
| `GPL-2.0-or-later`  | GNU General Public License version 2 or later          |
| `GPL-3.0-only`      | GNU General Public License version 3                   |
| `GPL-3.0-or-later`  | GNU General Public License version 3 or later          |
| `LGPL-2.1-only`     | GNU Lesser General Public License version 2.1          |
| `LGPL-2.1-or-later` | GNU Lesser General Public License version 2.1 or later |
| `LGPL-3.0-only`     | GNU Lesser General Public License version 3            |
| `LGPL-3.0-or-later` | GNU Lesser General Public License version 3 or later   |
| `MIT`               | Expat (MIT) License                                    |
| `Apache-2.0`        | Apache License 2.0                                     |
| `Artistic-2.0`      | Artistic License 2.0                                   |
| `BSD-3-Clause`      | BSD 3-Clause License                                   |
| `ISC`               | ISC License                                            |
| `MPL-2.0`           | Mozilla Public License 2.0                             |
| `CC0-1.0`           | Creative Commons Zero v1.0 Universal                   |

También acepta los identificadores antiguos `AGPL-3.0`, `GPL-2.0`, `GPL-3.0`,
`LGPL-2.1` y `LGPL-3.0` por compatibilidad con `package.json` viejos. Para
código nuevo, usa las variantes `-only` o `-or-later`.
