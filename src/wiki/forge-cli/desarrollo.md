---
title: forge-cli - Desarrollo
description: Estructura, compilación y pruebas de forge-cli.
wiki_project: forge-cli
---

`forge-cli` es un proyecto Zig pequeño y sin dependencias externas. Usa
`std.http` para hablar con la API de Forgejo y el resto es manejo de JSON,
argumentos y formato de salida.

## Estructura

```text
.
├── build.zig          Configuración de compilación y versión
├── build.zig.zon      Metadatos del paquete, versión y versión mínima de Zig
├── src/
│   ├── main.zig       CLI: flags, dispatch de acciones, salida
│   └── lib.zig        Cliente HTTP, configuración, endpoints y pruebas
├── guix.scm           Paquete reproducible
├── maak.scm           Tareas de build
└── channels.scm       Canal de Guix fijado
```

`main.zig` no contiene la lógica de la API. Parsea los argumentos, resuelve el
contexto y llama a una función de `lib.zig` por acción. `lib.zig` tiene las
estructuras `KeysFile`, `Context`, `Options`, las funciones de cada endpoint y
las pruebas.

## Requisitos

- Zig 0.16.0 o superior. `build.zig.zon` declara esa versión mínima.
- GNU Guix y Maak si quieres usar los targets del repositorio.
- `jq` es opcional, pero ayuda a leer las respuestas JSON.

## Compilar y probar

Con Zig directo:

```bash
$ zig build
$ zig build test
$ zig build run -- help
```

Con Maak:

```bash
$ maak build
$ maak test
$ maak build-test
```

`maak build` compila en `ReleaseSafe`. `maak test` ejecuta `zig build test`.
`maak build-test` compila y corre `forge-cli help` como una prueba rápida de que
el binario arranca.

El `build.zig` instala el ejecutable en `zig-out/bin/forge-cli`. También genera
un módulo `build_options` con la versión de `build.zig.zon`, que es lo que
imprime `--version`.

## Guix

```bash
$ guix build -f ./guix.scm
```

El paquete usa `zig-build-system`, `zig-0.16` y toma la fuente del directorio
actual. Es la forma recomendada si quieres una compilación reproducible sin
depender de la versión de Zig que tengas en el perfil.

El `channels.scm` fija GNU Guix a un commit concreto. Sirve para reproducir el
entorno del proyecto, no para actualizar el sistema.

## Pruebas

`zig build test` compila y ejecuta las pruebas de `lib.zig` y de `main.zig`. La
mayoría están en `lib.zig`: parseo de flags, lectura de `keys.json`, resolución
de contexto, construcción de query strings y manejo de errores de configuración.

Si tocas una acción, agrega o actualiza una prueba que cubra el caso feliz y al
menos un error. Si cambias un flag o un valor por defecto, actualiza el README y
esta wiki; el README es la referencia que lee quien instala.

## Versión y releases

La versión vive en `build.zig.zon`:

```text
.version = "0.1.2",
```

`build.zig` la pasa a `build_options` y `--version` la imprime. Para una
release, cambia la versión, ejecuta las pruebas, compila y etiqueta el commit.
El repositorio de Codeberg es un espejo de solo lectura; el desarrollo y las
releases salen del servidor de Urutaú.

## Estilo

El código usa allocators explícitos y libera lo que reserva. Las funciones de
`lib.zig` devuelven slices propiedad del llamador; el llamador tiene que
liberarlos con el mismo allocator. Si agregas una función, sigue ese contrato y
documéntalo en el comentario de la función.

## Agregar una acción

El flujo para una acción nueva es corto, pero toca varios archivos:

1. Agrega la función en `src/lib.zig`. Debe recibir el `Context`, el cliente
   HTTP y los argumentos, y devolver un slice JSON propiedad del llamador.
2. Si la acción lleva flags nuevos, agrega los campos a `Options` y parsealos en
   `parseFlags`.
3. Agrega la rama en `src/main.zig`. Valida la cantidad de argumentos antes de
   llamar a la API.
4. Actualiza `USAGE` en `main.zig` con la sintaxis nueva.
5. Agrega una prueba en `lib.zig` para la construcción del path o del body. Si
   la acción tiene flags, agrega también una prueba de parseo.
6. Ejecuta `zig build test` y `zig build run -- help`.

La función de `lib.zig` no debería imprimir nada. La salida y el formato quedan
en `main.zig`; así la lógica se puede probar sin capturar stdout.

## Contrato de memoria

Las funciones de `lib.zig` usan el allocator que reciben. Cuando devuelven un
slice, el llamador tiene que liberarlo con el mismo allocator. Si agregas una
función que arma un path con `allocPrint`, libera el path con `defer` y no lo
devuelvas mezclado con el JSON.

El `main.zig` usa un arena allocator. Eso simplifica la vida: no hay que liberar
cada string, pero tampoco se puede devolver memoria del arena a otra función que
espere un allocator de larga vida. Sigue el patrón de las funciones existentes.

## Pruebas

`zig build test` ejecuta las pruebas de `lib.zig` y `main.zig`. Las pruebas de
`lib.zig` usan `std.testing.allocator`, que detecta fugas. Si una prueba falla
por memoria, no la desactives: revisa el `defer` que falta.

Para una acción nueva, los casos mínimos son:

- argumento válido y path esperado;
- argumento faltante;
- flag opcional ausente;
- flag con valor inválido, si aplica.

No hace falta mockear toda la API. La mayoría de las funciones construyen un
path y un body; esas partes se pueden probar sin red.

## Guix y CI

`guix build -f ./guix.scm` compila el paquete con `zig-0.16`. Si cambias una
dependencia o la versión mínima de Zig, actualiza `build.zig.zon` y `guix.scm` a
la vez. El `channels.scm` fija el commit de Guix; no lo cambies para una release
sin probar el paquete completo.

El repositorio de Codeberg es un espejo de solo lectura. Si tu cambio tiene que
llegar al desarrollo, el flujo es el servidor de Urutaú, no un pull request en
el espejo.
