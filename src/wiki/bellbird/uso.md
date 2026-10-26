---
title: Bellbird - Uso
description: Claves, relay, cliente, tokens y conexión de aplicaciones.
wiki_project: Bellbird
---

El uso normal tiene tres pasos: generar las claves, arrancar el relay y arrancar
el cliente. El cliente es el que se conecta al relay; las aplicaciones hablan
SOCKS5 con el cliente en `127.0.0.1:1080`.

## 1. Generar claves

```bash
$ bell keygen --out relay
```

Produce dos archivos:

| Archivo     | Contenido                         | Permisos |
| ----------- | --------------------------------- | -------- |
| `relay.pub` | Clave pública híbrida, 1216 bytes | `0644`   |
| `relay.key` | Clave privada híbrida, 2432 bytes | `0600`   |

La clave pública se copia al cliente. La privada se queda en el relay y no se
reparte. Si la pierdes, todos los clientes dejan de autenticar el relay y hay
que generar un par nuevo.

## 2. Arrancar el relay

```bash
$ bell relay --key relay.key --listen :9001
```

| Flag                    | Por defecto | Qué hace                                         |
| ----------------------- | ----------- | ------------------------------------------------ |
| `--key`                 | `relay.key` | Ruta a la clave privada. Es obligatorio.         |
| `--listen`              | `:9999`     | Dirección donde escucha el relay.                |
| `--token`               | vacío       | Token de autenticación en línea.                 |
| `--token-file`          | vacío       | Archivo con el token.                            |
| `--allow-local-targets` | `false`     | Permite destinos locales. Solo para laboratorio. |

`--token` y `--token-file` son mutuamente excluyentes. El archivo se lee y se
recorta el espacio en blanco del final.

Los ejemplos usan `:9001` para que relay y cliente coincidan. Si omites
`--listen`, el relay escucha en `:9999`. El número no tiene nada de especial;
solo tiene que ser el mismo en el cliente y en el relay.

Por defecto el relay rechaza destinos `localhost`, loopback, link-local,
multicast y direcciones no especificadas. Esa guardia reduce el riesgo de SSRF y
de pivoteo. `--allow-local-targets` la desactiva; no lo uses en un relay
expuesto a internet.

## 3. Arrancar el cliente

```bash
$ bell client \
    --relay <ip-del-relay>:9001 \
    --pubkey relay.pub \
    --policy policy.zy \
    --listen 127.0.0.1:1080
```

| Flag           | Por defecto      | Qué hace                                 |
| -------------- | ---------------- | ---------------------------------------- |
| `--relay`      | vacío            | Dirección del relay. Es obligatorio.     |
| `--pubkey`     | `relay.pub`      | Clave pública del relay. Es obligatoria. |
| `--listen`     | `127.0.0.1:1080` | Dirección SOCKS5 local.                  |
| `--policy`     | `policy.zy`      | Script de ruido.                         |
| `--token`      | vacío            | Token de autenticación en línea.         |
| `--token-file` | vacío            | Archivo con el token.                    |

Si el relay exige token, el cliente manda un frame de autenticación antes de
pedir la conexión. Si no lo configuras, el relay rechaza la sesión.

## 4. Probar

```bash
$ curl --socks5-hostname 127.0.0.1:1080 https://example.com
```

Para una prueba completa del flujo SOCKS5, túnel, relay y destino:

```bash
$ bell selftest
```

`make e2e` compila y ejecuta ese selftest. El selftest levanta relay y cliente
en puertos locales, hace una petición y verifica que el tráfico pase por el
túnel.

## 5. Recargar la política

El cliente lee `policy.zy` al arrancar. Para recargarlo sin cortar las
conexiones:

```bash
$ kill -HUP $(pgrep '^bell$')
```

Si el binario se llama `bellbird`:

```bash
$ kill -HUP $(pgrep '^bellbird$')
```

La recarga reemplaza el entorno Lisp en memoria. Las llamadas que ya están en
curso terminan con la política vieja; las siguientes usan la nueva. El relay no
lee `policy.zy`; la política es del cliente.

## 6. Conectar aplicaciones

Cualquier aplicación que hable SOCKS5 sirve. Algunos ejemplos:

```bash
# curl
$ curl --socks5-hostname 127.0.0.1:1080 https://example.com

# Git
$ git config --global http.proxy socks5h://127.0.0.1:1080
$ git config --global https.proxy socks5h://127.0.0.1:1080

# SSH, en ~/.ssh/config
# Host servidor
#     ProxyCommand nc -x 127.0.0.1:1080 %h %p
```

En Firefox: Ajustes, Configuración de red, configuración manual, SOCKS Host
`127.0.0.1`, puerto `1080`, SOCKS v5. Si el navegador ofrece resolución remota
de DNS, actívala; el cliente ya delega los nombres al relay.

## DNS: no lo dejes fuera del túnel

`curl --socks5` resuelve el nombre en tu máquina y manda la IP al proxy. Eso
significa que la consulta DNS sale antes del túnel, en claro, y un observador
puede ver a qué dominio te conectas aunque el contenido vaya cifrado.

`curl --socks5-hostname` manda el nombre al proxy, y Bellbird lo resuelve en el
relay. Es la forma correcta de usar el proxy si tu preocupación es el
fingerprinting de destinos.

```bash
# Resolución local: la consulta DNS queda fuera del túnel.
$ curl --socks5 127.0.0.1:1080 https://example.com

# Resolución remota: el nombre viaja dentro del túnel.
$ curl --socks5-hostname 127.0.0.1:1080 https://example.com
```

Para Git, el esquema `socks5h://` fuerza la resolución remota:

```bash
$ git config --global http.proxy socks5h://127.0.0.1:1080
$ git config --global https.proxy socks5h://127.0.0.1:1080
```

No todas las aplicaciones distinguen entre `socks5` y `socks5h`. Si la tuya no
ofrece la variante remota, la consulta DNS puede filtrarse incluso con el proxy
funcionando. En ese caso, usa una aplicación que soporte DNS remoto o resuelve
el nombre dentro de una red de confianza.

## Lo que SOCKS5 no cubre

Bellbird implementa solo `CONNECT`. No hay `BIND` ni `UDP ASSOCIATE`, así que el
tráfico UDP no pasa por el túnel. Tampoco hay autenticación local: cualquier
proceso del mismo host que pueda conectarse a `127.0.0.1:1080` puede usar el
proxy. En una máquina multiusuario, eso es una frontera de confianza que
conviene tener en cuenta.

## Orden de arranque

1. Genera las claves en el relay.
2. Copia `relay.pub` al cliente.
3. Arranca el relay.
4. Arranca el cliente.
5. Configura la aplicación.
6. Prueba con `curl`.

Si algo falla, revisa primero la versión de ambos binarios. El protocolo y las
claves deben coincidir; actualizar solo un lado puede romper el handshake.
