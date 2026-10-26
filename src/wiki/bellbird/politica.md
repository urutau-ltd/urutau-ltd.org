---
title: Bellbird - Política de tráfico
description: Funciones, builtins y ejemplos de policy.zy.
wiki_project: Bellbird
---

La política de tráfico vive en un archivo `.zy` que el cliente evalúa con
[Zygomys](https://github.com/glycerine/zygomys), un intérprete de Lisp embebido
en Go. En lugar de un JSON con tres números, es un programa que puede usar
distribuciones, condicionales y las funciones que trae el intérprete.

## Funciones requeridas

El archivo debe definir exactamente estas tres funciones:

| Función             | Devuelve | Uso                                                      |
| ------------------- | -------- | -------------------------------------------------------- |
| `(packet_delay_ms)` | número   | Milisegundos de espera antes de enviar un frame.         |
| `(inject_dummy)`    | booleano | Si se inyecta un frame dummy en este tick.               |
| `(pad_to_size n)`   | número   | Tamaño objetivo, en bytes, para un payload de `n` bytes. |

`NewPolicy` valida las tres al cargar. Si falta una o el script no parsea, el
cliente no arranca.

## Builtins

Además de las funciones normales de Zygomys, Bellbird agrega:

| Builtin             | Qué hace                                                        |
| ------------------- | --------------------------------------------------------------- |
| `(rand)`            | Número uniforme en `[0, 1)`.                                    |
| `(rand-exp lambda)` | Variable exponencial con tasa `lambda`; la media es `1/lambda`. |
| `(ceil x)`          | Entero más chico mayor o igual a `x`.                           |
| `(floor x)`         | Entero más grande menor o igual a `x`.                          |

`rand-exp` es la herramienta para pasar de un jitter uniforme a uno con cola
larga. Un `lambda` más chico produce esperas más largas.

## Política por defecto

```lisp
// Retardo base de 8 a 22 ms, distribución uniforme.
(defn packet_delay_ms []
  (+ 8 (* (rand) 14)))

// Inyecta dummies con ~12 % de probabilidad por tick.
(defn inject_dummy []
  (< (rand) 0.12))

// Rellena al siguiente bloque de 512 bytes, contando el prefijo de 2 bytes.
(defn pad_to_size [n]
  (* 512 (ceil (/ (+ n 2) 512.0))))
```

El injector revisa `inject_dummy` cada 50 a 200 ms. Cuando devuelve `true`,
manda un frame dummy de entre 1 y 256 bytes, rellenado al bloque de 512. Los
dummies van cifrados igual que los datos; el tipo de frame viaja autenticado,
así que un observador que conozca el protocolo puede distinguirlos.

## Ejemplos

### Menos latencia

```lisp
(defn packet_delay_ms []
  (+ 2 (* (rand) 6)))

(defn inject_dummy []
  (< (rand) 0.05))

(defn pad_to_size [n]
  (* 512 (ceil (/ (+ n 2) 512.0))))
```

Sirve para navegación interactiva o para una red donde el ancho de banda es
escaso. El costo es menos protección contra correlación por tiempos.

### Perfil agresivo

```lisp
(defn packet_delay_ms []
  (+ 20 (* (rand-exp 0.25) 20)))

(defn inject_dummy []
  (< (rand) 0.30))

(defn pad_to_size [n]
  (* 1024 (ceil (/ (+ n 2) 1024.0))))
```

Más latencia, más ruido y frames más grandes. Es el perfil que tiene sentido
para una conexión que va a estar grabada y analizada, no para una sesión
interactiva.

### Bloques de 1024 sin cambiar el resto

```lisp
(defn pad_to_size [n]
  (* 1024 (ceil (/ (+ n 2) 1024.0))))
```

Puedes combinar los cambios que quieras. Lo importante es que las tres funciones
existan y devuelvan valores razonables.

## Dónde se aplica

El cliente aplica la política al tráfico que sale hacia el relay: rellena,
espera y manda. Las respuestas del relay también se rellenan, pero con el bloque
fijo de 512 bytes de `PadSize`, sin consultar `policy.zy`. Si cambias
`pad_to_size` a 1024, el lado del cliente usa 1024; el relay sigue usando 512
para lo que devuelve. La asimetría es deliberada en la implementación actual,
aunque no es evidente a simple vista.

## Errores y valores de respaldo

Si una evaluación falla en tiempo de ejecución:

- `DelayMs` devuelve 10 ms.
- `InjectDummy` devuelve `false`.
- `PadToSize` usa `PadSize(n)`, el bloque de 512.

La carga inicial sí es estricta: un script inválido o una función faltante
impiden arrancar. Los respaldos son para fallos raros durante la ejecución, no
para políticas a medio escribir.

## Recarga

```bash
$ kill -HUP $(pgrep '^bell$')
```

El cliente relee el archivo, valida las funciones y reemplaza el entorno. Si la
recarga falla, sigue con la política anterior y deja el error en el log. Las
conexiones abiertas no se cortan.

La recarga no cambia el relay ni las claves. Es solo ruido local del cliente.

## Elegir parámetros sin adivinar

La política es un compromiso entre latencia, ancho de banda y resistencia al
análisis. No hay un valor correcto para todos. Estas son las variables que
puedes mover:

| Variable          | Sube la protección                                  | Baja la latencia o el consumo     |
| ----------------- | --------------------------------------------------- | --------------------------------- |
| `packet_delay_ms` | Esperas más largas y menos correlación por tiempos. | Esperas cortas.                   |
| `inject_dummy`    | Más frames de ruido.                                | Menos ancho de banda y menos CPU. |
| `pad_to_size`     | Bloques más grandes ocultan mejor el tamaño.        | Menos overhead por paquete.       |

Un bloque de 512 agrega hasta 511 bytes de relleno por frame. Con 1024, el
overhead máximo se duplica. En una conexión interactiva eso se nota; en una
descarga grande, el costo relativo baja.

### Medir el efecto

No hay métricas internas. Para comparar políticas, mide el tiempo de una
petición real:

```bash
$ time curl --socks5-hostname 127.0.0.1:1080 https://example.com -o /dev/null -s
```

Haz varias pasadas con la política actual, cambia el archivo, recarga con
`SIGHUP` y repite. Si el tiempo no cambia, revisa que estés recargando el
cliente correcto. Un `packet_delay_ms` de 200 ms se tiene que notar.

Para ver el efecto del padding, compara el tamaño de un recurso pequeño con y
sin proxy. El contenido descargado es el mismo, pero el tráfico del túnel no.

## Cómo saber si la política se está aplicando

No hay un log por frame. Las señales disponibles son:

- el cliente imprime `policy reloaded OK` al recibir `SIGHUP`;
- una política con un delay grande cambia la latencia de `curl`;
- una política con `inject_dummy` en `true` genera más tráfico, visible en un
  contador de interfaz;
- un error de parseo impide arrancar o deja la política anterior.

Si cambias el archivo y no pasa nada, el cliente está leyendo otra ruta. Revisa
`--policy` y el directorio de trabajo. `policy.zy` es relativo al proceso, no al
archivo de configuración.

## Lo que la política no puede hacer

La política no cambia la criptografía, no elige el relay y no afecta al servidor
de destino. Tampoco rellena las respuestas del relay: eso lo hace el relay con
el bloque fijo de 512. Si buscas una defensa simétrica, la implementación actual
no la ofrece.
