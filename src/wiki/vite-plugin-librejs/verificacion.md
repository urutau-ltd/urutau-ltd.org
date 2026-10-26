---
title: vite-plugin-librejs - Verificación
description: Cómo comprobar la salida del plugin y automatizarlo en CI.
wiki_project: vite-plugin-librejs
---

Una build exitosa no garantiza que LibreJS vaya a aceptar el sitio. Hay que
revisar tres artefactos: los comentarios en los chunks, la tabla de web labels y
el enlace en el HTML.

## 1. Comentarios en los chunks

```bash
$ rg -n '@license|@license-end|@source' dist/assets
```

Deberías ver un par por cada `.js`, `.mjs` o `.cjs`. Para detectar chunks sin
comentario:

```bash
$ rg --files-without-match '@license' dist/assets/*.js
```

Si la lista no está vacía, esos archivos no llevan la nota. Las causas típicas
son `inlineComments: false`, un chunk que no termina en `.js`/`.mjs`/`.cjs` o
otro plugin que reescribe `chunk.code` después de este.

## 2. Tabla de web labels

```bash
$ test -f dist/about/javascript.html
$ rg -n 'jslicense-labels1' dist/about/javascript.html
```

La tabla tiene una fila por chunk, más una fila de encabezado. Para comparar:

```bash
$ rg -c '<tr>' dist/about/javascript.html
$ rg --files dist/assets | rg '\.(m?js|cjs)$' | wc -l
```

El primer número es la cantidad de chunks más uno. Si no coincide, revisa si
`weblabelsPath` cambió o si algunos chunks se emitieron fuera de `assets/`.

La tercera columna puede estar vacía si no hay `source`. Eso es válido para
licencias permisivas, pero para copyleft conviene que apunte a una URL real.

## 3. Enlaces en el HTML

```bash
$ rg -n 'rel="jslicense"' dist
```

Cada página HTML construida debería tener un enlace. El `href` es relativo a esa
página, así que no esperes una ruta absoluta. Para comprobar que no está roto,
resuelve el enlace contra la ubicación de la página y verifica que el archivo
exista.

Un script de Deno que hace las tres comprobaciones:

```ts
import { walk } from "jsr:@std/fs/walk";
import { dirname, relative, resolve } from "jsr:@std/path";

const dist = resolve("dist");
const assets = resolve("dist/assets");
const problems: string[] = [];

for await (const entry of walk(assets, { exts: [".js", ".mjs", ".cjs"] })) {
    const source = await Deno.readTextFile(entry.path);
    if (!source.includes("@license")) {
        problems.push(`sin @license: ${relative(dist, entry.path)}`);
    }
}

for await (const entry of walk(dist, { exts: [".html"] })) {
    const html = await Deno.readTextFile(entry.path);
    for (const [tag] of html.matchAll(/<a\b[^>]*rel="jslicense"[^>]*>/g)) {
        const href = tag.match(/href="([^"]+)"/)?.[1];
        if (!href) {
            problems.push(`enlace sin href: ${relative(dist, entry.path)}`);
            continue;
        }
        const target = resolve(dirname(entry.path), href);
        try {
            await Deno.stat(target);
        } catch {
            problems.push(
                `enlace roto: ${relative(dist, entry.path)} -> ${href}`,
            );
        }
    }
}

if (problems.length > 0) {
    console.error(problems.join("\n"));
    Deno.exit(1);
}
```

Guárdalo como `scripts/check-librejs.ts` y ejecútalo después de `vite build`. No
necesita permisos de red; solo lee `dist/`. El script revisa los chunks de
`dist/assets`; si tu build los emite en otra ruta, cambia `assets`. Los archivos
JavaScript que copies desde `public/` no pasan por el plugin, así que quedan
fuera de esta comprobación y tendrías que etiquetarlos a mano.

## 4. Prueba con LibreJS

Instala la extensión de GNU LibreJS en un navegador de pruebas y abre el sitio
servido desde `dist/`. LibreJS muestra qué scripts acepta y cuáles bloquea. Es
la única prueba que se parece al uso real.

Si el navegador bloquea un script que sí tiene comentario, revisa el magnet. El
info-hash tiene que ser el canónico; un SPDX correcto con un magnet inventado no
sirve.

## 5. Checklist para CI

Un ejemplo mínimo para un proyecto que ya construye con Vite:

```bash
#!/bin/sh
set -eu

deno task build

if rg --files-without-match '@license' dist/assets/*.js; then
    echo "Hay chunks sin comentario de licencia" >&2
    exit 1
fi

test -f dist/about/javascript.html
rg -q 'jslicense-labels1' dist/about/javascript.html
rg -q 'rel="jslicense"' dist/index.html
```

Ajusta las rutas a tu `outDir` y a tu página principal. Si usas `weblabelsPath`
personalizado, cambia el `test -f`.

## Qué no puede verificar este checklist

- Que la licencia declarada sea la correcta.
- Que la URL de `@source` exista.
- Que el magnet corresponda al texto de la licencia.
- Que el sitio no tenga JavaScript cargado fuera de Vite.

El plugin y el checklist cubren la parte mecánica. La parte legal sigue siendo
una revisión humana.
