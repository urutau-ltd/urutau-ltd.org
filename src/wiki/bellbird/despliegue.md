---
title: Bellbird - Despliegue
description: Formas de desplegar Bellbird en redes domésticas y equipos pequeños.
wiki_project: Bellbird
---

Bellbird está pensado para despliegues privados: una casa, una familia, un grupo
de amigos o una red de equipo. No hay una configuración única; la forma depende
de cuántos dispositivos tengas y de dónde esté el relay.

## Cliente por dispositivo

Es la opción recomendada. Cada laptop, desktop o servidor corre su propio
`bell client` y escucha en loopback.

```bash
$ bell client --relay relay.example:9001 --pubkey relay.pub \
    --policy policy.zy --listen 127.0.0.1:1080
```

Ventajas: cada dispositivo tiene su propia sesión, no compartes un puerto en la
LAN y el aislamiento es mejor. Desventaja: hay que mantener el cliente y la
política en cada máquina.

## Gateway compartido

Una sola máquina siempre encendida, por ejemplo una mini PC o una VM en el
router, corre el cliente y escucha en la LAN.

```bash
$ bell client --relay relay.example:9001 --pubkey relay.pub \
    --policy policy.zy --listen 192.168.1.10:1080
```

Los dispositivos que no pueden correr el cliente apuntan a esa dirección. Es
cómodo para televisores, consolas o móviles sin soporte SOCKS5 global, pero el
gateway se vuelve un punto único de fallo y un cuello de botella de privacidad.
Si lo usas, protégelo como protegerías el router.

## Relay en una red overlay

La forma más simple de no exponer el relay es ponerlo detrás de Tailscale,
Netbird, Zerotier o una VPN equivalente.

```text
cliente ──overlay──▶ relay ──▶ destino
```

El cliente apunta a la dirección del overlay, no a la IP pública. El relay no
necesita un puerto abierto a internet. Esta configuración es buena para viajes:
primero levantas el overlay y después arrancas Bellbird.

## Dos relays, dos perfiles

Puedes correr dos clientes en la misma máquina y separar aplicaciones por
puerto:

```bash
$ bell client --relay relay-a:9001 --pubkey relay-a.pub \
    --token-file relay-a.token --listen 127.0.0.1:1080 --policy policy.zy

$ bell client --relay relay-b:9001 --pubkey relay-b.pub \
    --token-file relay-b.token --listen 127.0.0.1:1081 --policy policy.zy
```

Las aplicaciones sensibles usan `1080`; las normales, `1081`. También puedes
usar políticas distintas para cada cliente, aunque el archivo se llame igual:
pasa una ruta diferente con `--policy`.

## Relay público

Es la opción menos recomendable. Si no puedes usar una red overlay, expón el
relay solo con token, firewall estricto y una política de rotación clara. Un
relay público puede ser usado por cualquiera que tenga el token y se convierte
en un punto de abuso y de responsabilidad legal. Si sospechas que un dispositivo
se perdió, rota el token.

## Redes públicas

Checklist para una red Wi-Fi de hotel, aeropuerto o cafetería:

1. Completa el portal cautivo antes de arrancar Bellbird.
2. Levanta la red overlay si la usas.
3. Arranca el cliente y prueba con `curl --socks5-hostname`.
4. Usa HTTPS en las aplicaciones.
5. Trata la LAN local como hostil; no confíes en servicios descubiertos por
   mDNS.

## Plataformas

### Linux

El cliente en loopback es lo más simple. `curl`, `git` y `ssh` aceptan SOCKS5
sin configurar nada global. El navegador se configura a mano.

### macOS

Puedes correr el cliente en la Mac y configurar SOCKS5 por aplicación. La
configuración global por red está en Ajustes del Sistema, Red, Detalles,
Proxies, SOCKS. Para la mayoría de los casos, la configuración por aplicación es
menos invasiva.

### Windows

El proxy del sistema está orientado a HTTP. Para SOCKS5, configura cada
aplicación o usa una herramienta local que exponga el proxy a las apps que lo
necesiten.

### Android e iOS

El proxy Wi-Fi del sistema suele ser HTTP, no SOCKS5. Las opciones prácticas son
aplicaciones con soporte SOCKS5 nativo o un gateway en la red que corra
`bell client`. En iOS, el gateway es la ruta más común.

## Higiene operativa

- Guarda `relay.key` fuera de los clientes y de los respaldos sin cifrar.
- Usa un token largo y aleatorio; no lo reutilices entre relays.
- Rota el token si un dispositivo se pierde.
- Actualiza cliente y relay juntos.
- Ejecuta `make ci` y `make verify` antes de actualizar.
- Revisa los logs del relay; no deberían mostrar destinos en el flujo normal,
  pero los errores de resolución sí pueden incluir un hostname.
- No ejecutes el relay con `--allow-local-targets` en producción.

## Lo que no debes esperar

Bellbird no reemplaza a Tor. No hay anonimato de red, no hay tres saltos y el
relay conoce el destino. Tampoco protege contra una aplicación que filtra
identificadores, cookies o fingerprints. Es una capa de transporte; las demás
capas siguen siendo tu responsabilidad.

## Unidad de systemd para el relay

Un ejemplo para un relay dedicado. Ajusta usuario, rutas y `--listen` antes de
usarlo; no es una receta universal.

```ini
[Unit]
Description=Bellbird relay
After=network-online.target
Wants=network-online.target

[Service]
User=bellbird
Group=bellbird
ExecStart=/usr/local/bin/bell relay \
    --key /etc/bellbird/relay.key \
    --listen :9001 \
    --token-file /etc/bellbird/relay.token
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadOnlyPaths=/etc/bellbird

[Install]
WantedBy=multi-user.target
```

El usuario `bellbird` necesita leer la clave y el token. El directorio
`/etc/bellbird` debería ser `0750` y los archivos `0600` o `0640` con el grupo
correcto. Si el relay escucha en un puerto menor a 1024, necesitarás
`CAP_NET_BIND_SERVICE` o un proxy delante; no añadas privilegios si no hace
falta.

El cliente también puede correr como servicio de usuario. En ese caso, el
listener en `127.0.0.1` y la política en el home del usuario son suficientes.

## Checklist antes de dejarlo corriendo

1. `bell selftest` pasa en la máquina del relay.
2. `bell selftest` pasa en la máquina del cliente.
3. `relay.pub` y `relay.key` tienen los tamaños correctos.
4. El token está configurado en ambos lados y no está en el historial del shell.
5. El relay no está expuesto a internet sin firewall.
6. El cliente escucha en loopback o en una interfaz de la red overlay.
7. `curl --socks5-hostname` funciona desde una aplicación real, no únicamente
   desde el selftest.
8. La política se recarga con `SIGHUP` y el log lo confirma.
9. Hay un plan para rotar claves y tokens.
10. Sabes qué hacer si el relay se cae: las conexiones nuevas fallan, las
    existentes se cortan.

## Si el relay se cae

El cliente no tiene failover. Si el relay no está disponible, las nuevas
conexiones SOCKS5 fallan; las que ya estaban abiertas se cortan cuando el túnel
se rompe. Para un servicio continuo, necesitas dos relays y dos perfiles de
cliente, o un mecanismo externo que cambie el `--relay`. Bellbird no elige el
relay por ti.

Esa simplicidad es deliberada: un failover automático puede mandar tráfico a un
relay que no esperabas. Si montas dos, decide a mano qué aplicaciones usan cada
puerto.
