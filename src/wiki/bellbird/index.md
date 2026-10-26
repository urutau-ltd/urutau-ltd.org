---
title: Bellbird
description: Proxy SOCKS5 con criptografía postcuántica y defensas contra análisis de tráfico.
wiki_project: Bellbird
---

Bellbird ataca un problema concreto: un observador pasivo puede inferir mucho de
una conexión aunque el contenido vaya cifrado. Los tiempos, los tamaños y la
dirección de los paquetes alcanzan para clasificar tráfico. TLS no cambia eso
porque su trabajo es proteger el payload, no los metadatos.

La respuesta de Bellbird es un SOCKS5 local que abre un túnel propio hasta un
relay. Dentro del túnel, el cliente rellena los frames, espera un tiempo
aleatorio antes de enviarlos e inyecta paquetes dummy. La intención no es volver
el tráfico invisible: es subir el costo de clasificarlo.

```text
[app] ──SOCKS5──▶ [bell cliente 127.0.0.1:1080] ──túnel PQC──▶ [bell relay] ──▶ [destino]
                          │
               jitter + dummy packets + padding
               controlado por policy.zy (hot-reload con SIGHUP)
```

## Por qué cada capa

| Capa                      | Para qué                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------- |
| ML-KEM-768 + X25519       | Proteger la sesión contra un adversario que graba hoy y descifra cuando tenga un computador cuántico. |
| AES-256-GCM               | Cifrar y autenticar cada frame; cualquier byte alterado invalida el frame.                            |
| HKDF-SHA256               | Derivar claves de sesión sin mandar la clave por la red.                                              |
| Padding, jitter y dummies | Quitarle al observador las señales de tamaño, tiempo y ráfaga.                                        |

El handshake usa la clave estática del relay y un intercambio efímero. El relay
también se autentica ante el cliente. Los detalles están en
[Seguridad](/wiki/bellbird/seguridad/).

## Qué no es

| Expectativa                         | Realidad                                             |
| ----------------------------------- | ---------------------------------------------------- |
| Anonimato de red                    | Es un proxy de un salto. El relay conoce el destino. |
| Reemplazo de Tor                    | No hay enrutamiento en cebolla ni tres saltos.       |
| Protección de la capa de aplicación | Cookies, fingerprints y user-agent viajan igual.     |
| Ofuscación del protocolo            | El handshake es reconocible; no se disfraza de TLS.  |
| Servicio para exponer a internet    | Está pensado para redes privadas y equipos pequeños. |

Si necesitas anonimato, combínalo con Tor, I2P o una VPN de confianza. Bellbird
es una capa de transporte, no una identidad.

## Cómo se opera

El orden es siempre el mismo:

1. `bell keygen --out relay` en el relay.
2. Copiar `relay.pub` al cliente.
3. `bell relay --key relay.key --listen :9001`.
4. `bell client --relay <ip>:9001 --pubkey relay.pub --listen 127.0.0.1:1080 --policy policy.zy`.
5. Configurar la aplicación para usar SOCKS5 en `127.0.0.1:1080`.

La política de ruido vive en el cliente y se puede recargar con `SIGHUP`. El
relay no lee `policy.zy`. Si el relay exige token, el cliente tiene que mandarlo
o la sesión se rechaza.

## Elegir topología

| Situación                   | Opción razonable                                             |
| --------------------------- | ------------------------------------------------------------ |
| Una laptop o desktop        | Cliente por dispositivo, listener en loopback.               |
| Varios dispositivos en casa | Gateway en una máquina siempre encendida.                    |
| Relay fuera de la LAN       | Red overlay tipo Tailscale, Netbird o Zerotier.              |
| Viaje con Wi-Fi público     | Overlay primero, después el cliente.                         |
| Relay expuesto a internet   | Token, firewall y rotación; es la opción menos recomendable. |

[Despliegue](/wiki/bellbird/despliegue/) tiene los patrones completos y un
ejemplo de unidad de systemd. [Diagnóstico](/wiki/bellbird/diagnostico/) cubre
los fallos que aparecen al montarlo.

## Documentación

| Página                                          | Qué vas a encontrar                                |
| ----------------------------------------------- | -------------------------------------------------- |
| [Instalación](/wiki/bellbird/instalacion/)      | Requisitos, compilación, Guix y el estado del CLI. |
| [Uso](/wiki/bellbird/uso/)                      | Flags, claves, tokens y conexión de aplicaciones.  |
| [Política de tráfico](/wiki/bellbird/politica/) | `policy.zy`, builtins y tradeoffs de latencia.     |
| [Despliegue](/wiki/bellbird/despliegue/)        | Topologías, systemd, higiene y checklist.          |
| [Seguridad](/wiki/bellbird/seguridad/)          | Criptografía, modelo de amenaza y límites.         |
| [Diagnóstico](/wiki/bellbird/diagnostico/)      | Síntomas, causas y cómo aislar el problema.        |

## Estado

> Licencia: GPLv3.0+

> Desarrollo:
> <chip class="ok">Público en
> <a href="https://codeberg.org/urutau-ltd/bellbird">Codeberg</a></chip>
> <chip class="info">Espejo en:
> <a href="https://github.com/urutau-ltd/bellbird">GitHub</a></chip>

El proyecto se describe como un experimento. La versión documentada es la rama
`main`; si el protocolo cambia, [Seguridad](/wiki/bellbird/seguridad/) es la
primera página que hay que revisar.

Para el razonamiento de diseño y la comparación con WTF-PAD, DAITA y Maybenot,
está la entrada del blog
[Defensa contra el espionaje impulsado por IA](/posts/tutorials/defensa-contra-las-ias-oscuras/).
