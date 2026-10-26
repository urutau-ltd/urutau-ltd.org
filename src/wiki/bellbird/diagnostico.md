---
title: Bellbird - Diagnóstico
description: Qué revisar cuando el relay, el cliente o la política no arrancan.
wiki_project: Bellbird
---

La mayoría de los fallos de Bellbird se pueden aislar en cuatro capas: claves,
relay, cliente y política. El selftest cubre las cuatro en local; cuando falla
algo en una red real, conviene probar por partes en vez de reiniciar todo.

## Primero: el selftest

```bash
$ bell selftest
```

Si el selftest pasa, el problema no está en el protocolo ni en las claves: está
en la red, en el token o en la configuración del cliente. El selftest levanta un
relay y un cliente locales, hace una conexión y verifica el flujo completo.

## Tabla de síntomas

| Síntoma                                         | Causa probable                                           | Qué hacer                                                             |
| ----------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| `relay: PrivateKey must be 2432 bytes`          | El archivo `--key` no es una clave privada de Bellbird.  | Vuelve a generarla con `bell keygen --out relay`.                     |
| `relay: invalid auth token`                     | El cliente no manda token o el token no coincide.        | Revisa `--token`/`--token-file` en ambos lados.                       |
| `relay: local or special target address denied` | El destino es local, loopback o link-local.              | Usa un destino público o `--allow-local-targets` solo en laboratorio. |
| `client: RelayPubKey must be 1216 bytes`        | El `--pubkey` no es la clave pública correcta.           | Copia `relay.pub`, no `relay.key`.                                    |
| `policy: required function missing`             | `policy.zy` no define una de las tres funciones.         | Revisa `packet_delay_ms`, `inject_dummy` y `pad_to_size`.             |
| `curl: (97) Can't complete SOCKS5 connection`   | El cliente no escucha en el puerto o el handshake falla. | Revisa `--listen`, logs del cliente y del relay.                      |
| `curl` se queda colgado                         | El relay no es alcanzable o el firewall bloquea.         | Prueba `nc -vz <relay> 9001` y revisa el puerto.                      |
| `connection refused` en el relay                | El relay no está corriendo o escucha en otra interfaz.   | Revisa `--listen` y `ss -ltnp`.                                       |

## Claves

Las claves tienen tamaños fijos:

- `relay.pub`: 1216 bytes.
- `relay.key`: 2432 bytes.

```bash
$ wc -c relay.pub relay.key
```

Si los tamaños no coinciden, el archivo está truncado, es de otra versión o es
el archivo equivocado. El cliente no acepta una clave privada como pública ni
viceversa.

## Relay

Arranca el relay en primer plano y mira el log:

```bash
$ bell relay --key relay.key --listen :9001
```

Deberías ver `bellbird relay: listening on :9001`. Si el proceso muere antes, el
error dice qué falta. Si arranca pero el cliente no conecta, revisa:

```bash
$ ss -ltnp | rg 9001
```

La dirección de `--listen` decide la interfaz. `:9001` escucha en todas; una IP
específica escucha solo ahí. Si el relay está detrás de un firewall, abre el
puerto solo para la red overlay o para la IP del cliente.

## Cliente

```bash
$ bell client --relay <ip>:9001 --pubkey relay.pub \
    --policy policy.zy --listen 127.0.0.1:1080
```

El log debería mostrar `SOCKS5 listening on 127.0.0.1:1080` y el relay
configurado. Si el cliente arranca pero `curl` falla, prueba el handshake SOCKS5
con `curl -v`:

```bash
$ curl -v --socks5-hostname 127.0.0.1:1080 https://example.com
```

`curl -v` muestra si el problema es la conexión al proxy, el handshake SOCKS5 o
la conexión al destino.

## Token

Si el relay tiene `--token` o `--token-file`, el cliente necesita el mismo
valor. No hay un modo "token opcional" en el cliente: si el relay lo exige y el
cliente no lo manda, la sesión se corta en el primer frame.

Comprueba que estás usando el mismo archivo y que no tiene espacios raros:

```bash
$ wc -c relay.token
$ head -c 4 relay.token | xxd
```

El cliente recorta el espacio en blanco al leer el archivo, pero un token con un
salto de línea interno no es válido. Genera el token con `printf` y no con un
editor que agregue líneas.

## Política

Si la política no carga, el cliente no arranca. El error incluye la función que
falló. Las causas típicas son:

- el archivo no existe en la ruta de `--policy`;
- una función está mal escrita;
- `pad_to_size` devuelve algo que no es un número;
- el script usa una función que no está en el entorno de Zygomys.

Para probar sin arrancar el cliente, usa el selftest con una política mínima:

```lisp
(defn packet_delay_ms [] 1)
(defn inject_dummy [] false)
(defn pad_to_size [n] (* 512 (ceil (/ (+ n 2) 512.0))))
```

Si esa política funciona, el problema está en la tuya.

## Recarga con SIGHUP

```bash
$ kill -HUP $(pgrep '^bell$')
```

Si el binario se llama `bellbird`, cambia el patrón. Si el proceso no recibe la
señal, el archivo no se recarga. Revisa el log: el cliente imprime si la recarga
funcionó o si falló el parseo. Una recarga fallida deja la política anterior
activa.

## Compilación

Si `make build` falla con "no Go files" o "package not found", revisa que estés
en la raíz del repositorio y que el paquete principal esté en tu copia.

Si `make test-race` se salta, es esperado: el `Makefile` no encontró `gcc`. Si
falla con un error de CGO, instala `gcc-toolchain` o usa el shell de Guix.

## Lo que no hay

Bellbird no expone métricas ni un endpoint de estado. Para medir latencia, usa
`time curl` contra el mismo destino con y sin el proxy. Para ver si el tráfico
pasa, mira los logs del relay en nivel normal: imprime que está reenviando una
sesión, no el destino. Los errores de resolución sí pueden incluir un hostname.

No hay un comando `doctor` ni un `--verbose`. Si necesitas más detalle, el
camino es aislar por capas con el selftest y los logs.
