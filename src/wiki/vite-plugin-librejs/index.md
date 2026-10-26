---
title: vite-plugin-librejs
description: Plugin de Vite para etiquetar JavaScript con la metadata que LibreJS necesita.
wiki_project: vite-plugin-librejs
---

Este plugin no decide si tu código es libre ni audita las licencias de tus
dependencias. Hace una cosa concreta: tomar el identificador SPDX que le pasas y
escribir la metadata que GNU LibreJS busca en el JavaScript emitido por Vite.

Esa distinción importa. Si tu problema es "no sé qué licencia tiene este
paquete", el plugin no te va a ayudar. Si tu problema es "ya sé qué licencia
tengo, pero LibreJS bloquea el sitio porque los chunks minificados no llevan la
nota", entonces sí.

## Cuándo tiene sentido

- Publicas un sitio con JavaScript y quieres que funcione con LibreJS.
- El proyecto se presenta como software libre y la build no debe romper esa
  promesa al minificar.
- Necesitas una página de web labels porque un proxy o CDN puede borrar los
  comentarios inline.
- Tienes un monorepo con dependencias de varias licencias y quieres etiquetar
  cada chunk por separado.

No hace falta para una API JSON, una herramienta interna sin navegador o un
sitio que no carga JavaScript. Tampoco reemplaza la revisión de compatibilidad
de licencias: etiquetar mal un chunk sigue siendo un problema legal, no técnico.

## Qué escribe en la salida

En `dist/` aparecen tres cosas:

1. Cada chunk `.js`, `.mjs` o `.cjs` envuelto entre `// @license ...` y
   `// @license-end`, con un `// @source` opcional.
2. Una página `about/javascript.html` con la tabla `jslicense-labels1`.
3. Un `<a rel="jslicense">` en el body de cada HTML construido.

Los tres mecanismos cubren el mismo problema por caminos distintos. Los
comentarios son la vía directa; la tabla es el respaldo cuando un proxy borra
comentarios o cuando el script se sirve desde otro origen; el enlace es lo que
permite a LibreJS encontrar la tabla.

## Instalación

```bash
$ deno add jsr:@urutau-ltd/vite-plugin-librejs
```

O importa desde JSR sin instalar nada:

```ts
import { defineConfig } from "npm:vite";
import { librejsPlugin } from "jsr:@urutau-ltd/vite-plugin-librejs";

export default defineConfig({
    plugins: [
        librejsPlugin({
            license: "AGPL-3.0-or-later",
            sourceBase: "https://example.com/src/",
        }),
    ],
});
```

## Cómo saber si funcionó

No basta con que la build termine. Hay que mirar la salida:

```bash
$ rg -n '@license|@license-end|@source' dist/assets
$ rg -n 'jslicense-labels1|rel="jslicense"' dist
```

Si los chunks no tienen comentarios, revisa `inlineComments`. Si la página no
existe, revisa `weblabels`. Si el HTML no tiene el enlace, revisa
`injectLicenseLink` y que Vite esté procesando esas páginas. La guía completa
está en [Verificación](/wiki/vite-plugin-librejs/verificacion/).

## Lo que no hace

- No escanea las dependencias ni deduce licencias.
- No traduce la página de web labels; se genera en inglés.
- No comprueba que las URLs de `@source` existan.
- No procesa HTML que no pase por los hooks de Vite.
- No sustituye una oferta de código fuente para licencias copyleft.

## Documentación

| Página                                                      | Qué vas a encontrar                                     |
| ----------------------------------------------------------- | ------------------------------------------------------- |
| [Opciones](/wiki/vite-plugin-librejs/opciones/)             | Defaults, overrides por chunk y licencias incorporadas. |
| [Funcionamiento](/wiki/vite-plugin-librejs/funcionamiento/) | Dónde se inyecta cada cosa y por qué.                   |
| [Verificación](/wiki/vite-plugin-librejs/verificacion/)     | Cómo auditar la salida y automatizarlo en CI.           |
| [API](/wiki/vite-plugin-librejs/api/)                       | Exports programáticos y tipos.                          |
| [Problemas](/wiki/vite-plugin-librejs/problemas/)           | Errores comunes y cómo aislarlos.                       |

## Estado

> Licencia: AGPL-3.0-or-later

> Desarrollo:
> <chip class="ok">Público en
> <a href="https://codeberg.org/urutau-ltd/vite-plugin-librejs">Codeberg</a></chip>
> <chip class="info">Espejo en:
> <a href="https://github.com/urutau-ltd/vite-plugin-librejs">GitHub</a></chip>

La versión documentada es la 1.0.4. Soporta Vite 6, 7 y 8. En Vite 7 y 8 se
apoya en los tipos de Rollup que Vite reexporta; no importa Rolldown
directamente.
