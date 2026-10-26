---
title: vite-plugin-librejs - API
description: Exports programáticos y tipos del plugin.
wiki_project: vite-plugin-librejs
---

Todo se exporta desde `mod.ts`:

```ts
export { librejsPlugin } from "./plugin.ts";
export type { ChunkLicense, LibreJSOptions } from "./plugin.ts";
export { getLicense, LICENSES } from "./licenses.ts";
export type { LicenseInfo, LicenseMap } from "./licenses.ts";
export { generateWeblabelsHtml } from "./weblabels.ts";
export type { WeblabelEntry } from "./weblabels.ts";
```

## `librejsPlugin`

```ts
import { librejsPlugin } from "jsr:@urutau-ltd/vite-plugin-librejs";

const plugin = librejsPlugin({
    license: "AGPL-3.0-or-later",
    sourceBase: "https://example.com/src/",
});
```

Devuelve un `Plugin` de Vite. Lanza error si la licencia no está en la tabla y
no hay `magnet`. La validación ocurre al crear el plugin, no al ejecutar el
build.

## `LICENSES`

Mapa inmutable de SPDX a metadata:

```ts
import { LICENSES } from "jsr:@urutau-ltd/vite-plugin-librejs";

console.log(LICENSES["MIT"]);
```

Cada entrada tiene:

```ts
interface LicenseInfo {
    magnet: string;
    label: string;
    url: string;
}
```

`LICENSES` está congelado. Si necesitas una licencia fuera de la tabla, pasa un
`magnet` en las opciones en vez de modificar el mapa.

## `getLicense`

```ts
import { getLicense } from "jsr:@urutau-ltd/vite-plugin-librejs";

const info = getLicense("MIT");
// { magnet, label, url }
```

Devuelve `undefined` si el SPDX no está en la tabla. No lanza.

## `generateWeblabelsHtml`

Genera un documento HTML completo con la tabla `jslicense-labels1`. Sirve para
scripts de build que no pasan por Vite.

```ts
import { generateWeblabelsHtml } from "jsr:@urutau-ltd/vite-plugin-librejs";

const html = generateWeblabelsHtml([
    {
        scriptPath: "/assets/app.js",
        scriptName: "app.js",
        licenseLabel: "GNU General Public License version 3 or later",
        licenseUrl: "https://www.gnu.org/licenses/gpl-3.0.html",
        sourcePath: "https://example.com/src/app.js",
    },
]);
```

La firma es:

```ts
const generateWeblabelsHtml = (
    entries: ReadonlyArray<WeblabelEntry>,
    pageTitle = "JavaScript License Information",
): string => {/* ... */};
```

`WeblabelEntry` tiene estos campos:

| Campo          | Obligatorio | Uso                            |
| -------------- | ----------- | ------------------------------ |
| `scriptPath`   | Sí          | URL del script servido.        |
| `scriptName`   | Sí          | Texto del enlace.              |
| `licenseLabel` | Sí          | Nombre legible de la licencia. |
| `licenseUrl`   | Sí          | URL del texto de la licencia.  |
| `sourcePath`   | No          | URL del código fuente.         |

Los valores se escapan antes de insertarse en el HTML. La página generada usa
`lang="en"` y texto fijo en inglés; `pageTitle` solo cambia el título.

## Tipos

```ts
interface ChunkLicense {
    license?: string;
    magnet?: string;
    source?: string;
}

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
```

Los tipos están pensados para importarse con `import type` y no dejan residuo en
el bundle.

## Caso de uso: un pipeline propio

El plugin ya hace esto durante `vite build`. La API programática sirve cuando
tienes un pipeline que no pasa por el plugin, o cuando quieres generar la tabla
desde una lista de archivos que ya conoces.

Un ejemplo mínimo que recorre `dist/` y arma la página:

```ts
import { walk } from "jsr:@std/fs/walk";
import { relative } from "jsr:@std/path";
import {
    generateWeblabelsHtml,
    LICENSES,
} from "jsr:@urutau-ltd/vite-plugin-librejs";

const license = LICENSES["AGPL-3.0-or-later"];
if (!license) throw new Error("licencia no encontrada");

const entries = [];
for await (const entry of walk("dist", { exts: [".js"] })) {
    const scriptPath = `/${relative("dist", entry.path)}`;
    entries.push({
        scriptPath,
        scriptName: scriptPath.split("/").at(-1) ?? scriptPath,
        licenseLabel: license.label,
        licenseUrl: license.url,
        sourcePath: `https://example.com/src/${scriptPath.split("/").at(-1)}`,
    });
}

await Deno.writeTextFile(
    "dist/about/javascript.html",
    generateWeblabelsHtml(entries, "Licencias del JavaScript"),
);
```

Esto no inyecta los comentarios inline ni el enlace `rel="jslicense"`. Si
necesitas las tres cosas, usa el plugin de Vite. La API programática es para
casos donde ya tienes el control del pipeline y solo falta la tabla.

La ruta `sourcePath` del ejemplo es inventada. Cámbiala por una URL real; la
tabla no valida que exista.
