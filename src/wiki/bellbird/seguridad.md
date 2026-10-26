---
title: Bellbird - Seguridad
description: Criptografía, modelo de amenaza y límites de Bellbird.
wiki_project: Bellbird
---

Bellbird combina criptografía postcuántica con defensas de tráfico. Esta página
describe qué hay debajo, qué amenazas cubre y qué queda fuera. Está basada en el
código de la rama `main`; si el protocolo cambia, esta es la página que hay que
revisar primero.

## Handshake

El relay tiene un par de claves híbrido:

| Material                                | Tamaño     |
| --------------------------------------- | ---------- |
| Clave pública (`ML-KEM-768` + `X25519`) | 1216 bytes |
| Clave privada                           | 2432 bytes |
| Ciphertext de encapsulación             | 1120 bytes |

El cliente encapsula un secreto contra la clave pública del relay con ML-KEM-768
y hace un Diffie-Hellman X25519 con la parte clásica. Después agrega un
intercambio efímero X25519 para forward secrecy. La clave de sesión se deriva
con HKDF-SHA256 a partir de ambos secretos. La clave final nunca viaja por la
red.

El relay responde con su clave efímera y un tag de autenticación del transcript.
El cliente verifica ese tag antes de seguir. Sin esa verificación, un atacante
que pudiera interceptar la conexión podría hacerse pasar por el relay.

## Cifrado y framing

Cada frame tiene esta forma en el cable:

```text
[tipo:1][longitud_ciphertext:2][nonce:12][AES-256-GCM ciphertext]
```

Los primeros 15 bytes son el AAD: van en claro, pero cualquier modificación hace
fallar la autenticación. El nonce es un contador estrictamente creciente. El
relay rechaza un nonce repetido, lo que cierra los ataques de replay. Cliente y
relay usan claves distintas por dirección, así que el mismo valor de contador no
se reutiliza bajo la misma clave.

Los frames de datos llevan el payload original con un prefijo de longitud y
relleno hasta el bloque correspondiente. El receptor quita el relleno antes de
entregar los bytes a la aplicación.

## Defensas de tráfico

| Defensa | Qué hace                                                     |
| ------- | ------------------------------------------------------------ |
| Padding | Lleva cada frame a un múltiplo de 512 bytes por defecto.     |
| Jitter  | Duerme un tiempo configurable antes de enviar.               |
| Dummies | Inyecta frames de ruido cada 50 a 200 ms, según la política. |

El padding elimina el tamaño exacto del payload como señal. El jitter rompe la
correlación por tiempos. Los dummies contaminan los patrones de ráfaga. Las tres
cosas juntas suben el costo de un clasificador, pero no lo vuelven imposible.

El padding tiene un costo visible: un payload de un byte puede terminar en un
frame de 512. Eso es intencional. Los paquetes pequeños son los más informativos
para el fingerprinting.

## Modelo de amenaza

Bellbird está diseñado contra un adversario pasivo que observa el cable:

- correlación de tiempos entre entrada y salida;
- fingerprinting por tamaños de payload;
- análisis de patrones de ráfaga;
- grabación de tráfico para descifrarlo cuando exista un computador cuántico
  capaz de romper la criptografía clásica (HNDL).

La parte postcuántica cubre el último punto. Si ML-KEM-768 tiene un fallo
desconocido, X25519 sigue dando seguridad clásica; si X25519 cae ante un
computador cuántico, ML-KEM-768 sigue en pie. La seguridad no depende de un solo
ladrillo.

## Lo que Bellbird no cubre

- **Anonimato de red.** Es un proxy de un salto. El relay conoce el destino y
  puede ver los datos si la aplicación no usa TLS.
- **Un relay malicioso.** Si el operador del relay está comprometido, puede
  registrar destinos y tráfico.
- **Compromiso de ambos extremos.** Si el adversario controla cliente y relay, o
  cliente y destino, el túnel no ayuda.
- **Capa de aplicación.** Cookies, user-agent, canvas, WebGL y cualquier
  identificador que envíe la aplicación viajan dentro del túnel y el destino los
  ve igual.
- **Reconocimiento del protocolo.** El handshake tiene una forma reconocible.
  Bellbird no se disfraza de TLS ni de otro protocolo.
- **UDP.** Solo se implementa `CONNECT` de SOCKS5. `BIND` y `UDP ASSOCIATE`
  quedan fuera.
- **Autenticación local.** El listener SOCKS5 no pide credenciales. Cualquier
  proceso del mismo host que pueda conectarse a `127.0.0.1:1080` puede usarlo.
- **Política estática entre sesiones.** La misma `policy.zy` se aplica a todas
  las sesiones hasta que la recargas con SIGHUP. Un adversario con muchas
  muestras puede aprender la distribución del ruido.

## Endurecimiento

### Token de relay

```bash
$ bell relay --key relay.key --listen :9001 --token-file relay.token
$ bell client --relay relay.example:9001 --pubkey relay.pub \
    --token-file relay.token --listen 127.0.0.1:1080 --policy policy.zy
```

Sin token, cualquier cliente que conozca la dirección del relay puede abrir
túneles. El token se compara en tiempo constante sobre un hash SHA-256, así que
no se filtra por timing. Usa un valor largo, aleatorio y distinto por relay.

### Destinos locales

Por defecto el relay rechaza `localhost`, loopback, link-local, multicast y
direcciones no especificadas. También resuelve los nombres y elige la primera IP
permitida. `--allow-local-targets` desactiva la guardia; solo tiene sentido en
laboratorio.

### Red

Mantén el relay en una red overlay o detrás de un firewall. Si lo expones a
internet, usa token y revisa los logs. El relay no debería ser un servicio
abierto a cualquiera.

## Reportar un fallo

La política del repositorio pide reportar vulnerabilidades en privado antes de
abrir un issue público. Incluye impacto, pasos de reproducción, versión o commit
y entorno. El archivo `SECURITY.md` del repositorio tiene el detalle
actualizado. No publiques exploits sin parchear.

## Una nota sobre el nombre

Bellbird no es un sistema de anonimato. El nombre y la estética pueden sugerir
más de lo que hace. Si lo que buscas es ocultar quién habla con quién frente a
un adversario global, necesitas una red de anonimato, no un proxy de un salto.
Bellbird es una pieza para subir el costo de la vigilancia pasiva, no una
solución completa.

## Rotar claves

Las claves del relay son estáticas. Si cambias el par, todos los clientes
necesitan la nueva `relay.pub` y el relay necesita la nueva `relay.key`.

1. Genera un par nuevo en el relay: `bell keygen --out relay-nuevo`.
2. Detén el relay.
3. Sustituye `relay.key` por `relay-nuevo.key`.
4. Distribuye `relay-nuevo.pub` a los clientes.
5. Arranca el relay y los clientes.
6. Verifica con `bell selftest` o con `curl --socks5-hostname`.

No hay rotación en caliente ni varias claves activas a la vez. Un cliente con la
clave vieja falla el handshake; el error es genérico, así que revisa primero la
versión de `relay.pub`.

## Si sospechas que una clave se filtró

La clave privada del relay permite a un atacante hacerse pasar por el relay si
también controla la red, y descifrar sesiones si logra interceptarlas. No es una
clave de identidad de usuario, pero compromete la autenticación del relay.

1. Genera un par nuevo.
2. Rota el token de autenticación.
3. Revisa los logs del relay por sesiones extrañas.
4. Actualiza todos los clientes.
5. Si el relay estaba expuesto, considera que el tráfico pudo ser observado.

No hay forma de revocar una clave estática sin cambiar el par. La rotación es el
mecanismo de revocación.

## Verificar que estás usando las claves correctas

```bash
$ wc -c relay.pub relay.key
1216 relay.pub
2432 relay.key
```

Si los tamaños no coinciden, no sigas. Un archivo de 32 bytes es una clave
X25519 suelta, no el par híbrido. Un archivo de 1184 bytes es solo la parte
ML-KEM pública. El cliente y el relay rechazan esos tamaños con un error
explícito.

## Rotar el token

El token no tiene relación con las claves. Se puede cambiar sin regenerar el
par:

1. Genera un token nuevo.
2. Actualiza `relay.token` y el archivo del cliente.
3. Reinicia el relay y el cliente, o recarga la configuración si tu despliegue
   lo permite.

El cliente lee el token al arrancar; no hay recarga por `SIGHUP` para el token.
Si el relay cambia el token y el cliente sigue con el viejo, la sesión se corta
en el primer frame.
