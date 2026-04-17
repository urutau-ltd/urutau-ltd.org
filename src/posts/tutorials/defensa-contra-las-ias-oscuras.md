---
title: "Defensa contra el espionaje impulsado por IA"
description: Creando un proxy SOCKS5 pensado para la era de la criptografía postcuántica.
sample: "Hace poco hice público el código de bellbird, un proxy SOCKS5 con resistencia
    al analisis de tráfico con IA. Te enseño porque tú deberías hacer algo parecido"
date: "2026-04-17"
author: "FuncProgLinux"
draft: true
tags:
    - Dev
    - Go
    - Guix
    - SecOps
    - Security
    - Privacy
layout: "layouts/post.tsx"
---

<details>
    <summary>Índice:</summary>
    <!-- Don't forget the newline before and after [[toc]]!!! -->

    [[toc]]

</details>

## The lights go down and it's too late. This is the greatest show on earth!

_AITA_, las siglas de _"AI-guided Traffic Analysis"_ en Inglés, describe los
sistemas que combinan recoleción de datos a gran escala con los servicios
(propios o rentados) de Inteligencia Artificial para rastrear o predecir el
comportamiento de uno o varios individuos.

Para quienes están preocupad@s por la vigilancia intrusiva, sea comercial o
gratis por parte del estado, el objetivo final, creo, es el mismo: _resilencia_,
reducir al máximo la exposición de datos, incrementar lo máximo posible la
incertidumbre para los adversarios y utilizar la ley a tu favor para mantener
tus libertades civiles y al mismo tiempo, retomar el control que te pertenece.

Para eso he creado `bellbird` en Urutaú Limited, aunque sigue siendo demasiado
pronto para presentarlo, por el momento es suficiente con que sepas que existe.

Antes de hablar de defensa, es importante ser específicos sobre _quién_ ataca y
desde _dónde_. El análisis de tráfico no requiere de romper cifrado. Requiere
observar "el cable" (también lo referiremos como "the wire" en algunas
secciones) por donde pasan los bytes cifrados y extraer información de su forma,
los tamaños de los paquetes, tiempos de llegada, dirección (E/S), patrones de
ráfaga.

Los adversarios relevantes para el diseño de esta herramienta son:

- Los adversarios pasivos de red, es decir, todo actor de riesgo que se dedique
  a observar el tráfico que no tiene permitido observar.

- No busca detener por si mismo a un adversario que controle el relay o que
  pueda observar simultaneamente ambos extremos de una comunicación.

...y ya, es todo, `bellbird` está hecho para protegerte, de observadores de red.

## TLS no es suficiente

TLS resuelve el problema de la confidencialidad e integridad de los _payloads_
(datos) que enviamos a través de la red. Lo que no resuelve (por diseño, no por
accidente) es la confidencialidad de los metadatos de las operaciones. Un
observador pasivo en cualquier punto de la ruta tiene acceso sin restricciones
a:

- Los tiempos de llegada de los paquetes (`IAT`) a resolución de microsegundos
  en hardware moderno.
- Longitudes de registros TLS que mapean directamente el tamaño del objeto
  `HTTP` subyacente
- La dirección del flujo de datos, es decir, la distribución de E/S revela el
  tipo de operación (descarga de objetos grandes, streaming, polling de APIs)

Y otros que tal vez no conozco o no están listados aquí.

Estos vectores combinados nos pueden revelar suficiente información de los
hábitos de navegación de cualquier persona aunque no podamos ver los datos
cifrados via `HTTPS`. Si bien `HTTP/2` ayuda gracias al _multiplexing_, está muy
claro que al ser una revisión de un protocolo no puede cubrir todos los
aspectos. `QUIC` también se queda corto, por si pensabas mencionarlo.

> Al menos dime ¿Por qué QUIC se queda corto?

Buena pregunta, QUIC cifra la gran mayoría de sus headers y en efecto, eso ayuda
a aumentar la incertidumbre de que datos están siendo transmitidos, por otra
parte algunos campos en el protocolo deben cumplir con ciertas características
como un _X_ número de bits de entropía. El problema es que no elimina la señal
porque los objetos que componen la transferencia de datos, conservan tamaños
determinísticos impuestos por el servidor, no por el protocolo de transporte.

¿Qué quiero decir con esto? La variación que introducen estos protocolos
(protocolo, porque el primero es una revisión nada más xD) es muy superficial
respecto a la señal que identifica un recurso, que puede ser un HTML, CSS, JS,
imágenes de distintos formatos, un archivo PDF, etc. Todo esto sigue teniendo
longitudes y patrones de emisión al nivel _"servidor"_ donde _"servidor"_ es el
software con un socket HTTP(s), es decir, los cambios en la capa de transporte
no son suficientes.

TLS surgió para responder a la necesidad operativa de cifrar los _payloads_ o
cuerpos de las peticiones, pero, como ya sabemos, es insuficiente. Y esto no es
pura teoría. Te tengo un dato nuevo, la NSA ya usaba esta clase de análisis de
tráfico con su software [XKeyscore](https://archive.org/details/nsa-xkeyscore).

Cualquier adversario con capacidad de ver el tráfico en bruto de cualquier
enlace de red puede clasificar el tráfico, inferir el o los sitios visitados,
identidficar si hay algún protocolo de anonimato en uso y correlacionar los
extremos de las comunicaciones. 0 honeypots, 0 phishing, 0 credenciales robadas.
Algo terrorífico, si, pero bastante interesante en mi opinión.

El problema es que, hasta hace unos años, esta tarea requería de reglas
manuales, curado de datos o procesos donde los humanos estaban altamente
involucrados, ahora, le es delegado a redes neuronales que operan sobre una
secuencia continua de paquetes en bruto. Pero, lo hermoso de la informática, es
que todo se puede responder por las buenas o por las malas.

Vamos a ser un poco más concretos sobre qué hace esa red neuronal.

## Website fingerprinting

Esto tiene una cantidad considerable de...¿literatura? académica detrás. La
premisa de parte de una propiedad estructural de HTTP sobre TLS:

_"Los recursos que componen una página web tienen tamaños determinados por el
servidor y son recuperables de forma reproducible entre sesiones"_

Lo que el adversario observa sobre el _"wire"_ es una serie temporal de tuplas
`(timestamp, longitud, dirección)` por cada paquete del flujo. Esa
representación es estable entre sesiones porque los objetos del sitio no cambian
entre visitas, y es suficientemente única para identificar al sitio con alta
confianza aunque el contenido vaya cifrado. Es importante que conozcas este
concepto, guárdalo para más adelante.

## Deep Fingerprinting

Esto es un [artículo](https://arxiv.org/abs/1801.02265) publicado por Payap
Sirinam, Mohsen Imani, Marc Juarez, Matthew Wright y es Website Fingerprinting,
pero con
[redes neuronales convolucionales](https://www.ibm.com/mx-es/think/topics/convolutional-neural-networks)

Este paper reemplazó las features manuales que estaban presentes en los ataques
de Website Fingerprinting por una CNN (Siglas para _Convolutional Neural
Network_) que procesa directamente la secuencia de paquetes que mencionamos en
Website Fingerprinting, en bruto, representando cada paquete como una tupla
`(tamaño, dirección)`. Yo no soy experto, entendido ni mucho menos se programar
_nada_ del amplio espectro de la IA, pero algo que leí que son muy buenas
haciendo estas redes neuronales es detectar patrones locales. Con menos de un
millón de parámetros, Deep Fingerprinting logró una precisión del 98% contra Tor
en un escenario de "mundo cerrado".
[Aquí](https://github.com/deep-fingerprinting/df) te dejo el código fuente que
se usó para el artículo.

Esto fue en 2018. El día que escribí esto es (o era, dependiendo de cuando lo
leas) el año 2026, hace 2 años (2024) la _Association for Computing Machinery_
publicó un [artículo](https://dl.acm.org/doi/abs/10.1145/3658644.3670272) donde
proponíen una variante todavía más potente. Holmes añade análisis
espacio-temporal y puede atacar el tráfico tan pronto como tenga el 21% del
sitio descargado en algunos casos (El preprint reporta ~21.71% en promedio para
su escenario sobre sitios dark web). Ojo con esto, pues, no significa 100% de
éxito, significa que la señal útil aparece mucho antes de que termine de cargar
la página.

Y es en este segundo punto donde podemos concluir que proteger solo el final de
la sesión **tampoco es suficiente**.

## La vida real siempre es más compleja

En este
[artículo](https://www.semanticscholar.org/paper/Beyond-a-Single-Perspective%3A-Towards-a-Realistic-of-Deng-Chen/3cbb193d0c7f016ba2b9c53b1decdfabff93c8bd)
titulado _"Beyond a Single Perspective: Towards a realistic evaluation of
website fingerprinting attacks"_, se exploran los algoritmos anteriormente
mencionados, AWF, Deep Fingerprinting y Holmes. Sin embargo, de acuerdo al
abstract (y adentro del artículo en la sección "Discussion") muchos de los
ataques con 90% o más de precisión en condiciones de laboratorio se degradan
bastante cada que se implementan defensas activas y escenarios realistas.

La vigilancia masiva e indiscriminada es y sigue siendo BASTANTE costosa.
Vigilar a una sola persona no, la idea es que más y más personas tomen medidas
que protejan su privacidad y, por lo tanto, aumenten el costo operacional al
punto en que la vigilancia masiva sea económicamente inviable.

## Correlación de timing

Un ataque aparte que requiere una defensa distinta: un adversario podría
observar simultáneamente el tráfico saliente de tu máquina y el entrante al
destino final, puede correlacionarlos comparando las series de IATs en ambos
extremos.

En la formulación básica, el
[coeficiente de correlación](https://www.lifeder.com/coeficiente-de-correlacion/)
es suficientemente alto para atribuir la conexión, aunque vaya detrás de un
proxy.

Los ataques activos son más eficientes aún: el adversario puede inyectar ráfagas
o _["burst"](https://en.wikipedia.org/wiki/Burst_transmission)_ con un patrón
conocido

## En las penumbras se forja la libertad de los perseguidos

Hasta aquí hemos hablado de quien observa y clasifica en tiempo real. Pero hay
otro tipo de adversario que `bellbird` también tiene bien identificado y es el
que no se detiene a clasificar hoy, solo graba y espera.

Esto tiene un nombre, como todo en la computación, prevalece el término en
idioma Inglés: **HNDL** _"Harvest Now, Decrypt Later"_. El razonamiento es el
siguiente:

Todo el tráfico que viaja por internet a dia de hoy va cifrado con criptografía
de clave pública (RSA, ECDH, X25519) cuya securidad descansa en problemas
matemáticos que resultan algo difíciles de resolver para las computadoras de
estos tiempos.

El
[algoritmo de Shor](https://dasobral.github.io/curso-pqc-santander/ejemplos/algoritmo_shor.html)
(1994) puede factorizar números enteros grandes en tiempo polinómico, es decir,
que el número de bits no crece de forma exponencial, con eso es capaz de romper
RSA.

También resuelve el logaritmo discreto, lo que rompe
[ECDH](https://wiki.openssl.org/index.php/Elliptic_Curve_Diffie_Hellman) y sus
variantes, por lo que una computadora cuántica con suficientes qubits lógicos
podría descifrar cualquier sesión TLS/SSH que sea grabada el dia de hoy (Abril
2026).

Ya desde el 2015 la propia NSA anunció su intención de migrar a criptografía
post-cuántica, eso me dice que, como mínimo consideraban la amenaza
suficientemente real como para cambiar sus propios estándares.

> ¿Ha llegado todavía la computadora cuántica que hace esto posible?

No. IBM tiene publicado un
[roadmap](https://www.ibm.com/quantum/blog/ibm-quantum-roadmap-2025) para
escalar hacia sistemas tolerantes a fallos, se sabe que detrás de la computación
cuántica hay inversión militar global. Tan solo en 2023 el Departamento de
Justicia de los Estados Unidos
[realizó una petición](https://iq.govwin.com/neo/marketAnalysis/view/FY-2023-Defense-Investment-in-Quantum-Information-Science/6864?researchMarket=&researchTypeId=1)
por +$700M de dólares en inversión para investigación y desarrollo relacionado a
la compuitación cuántica y en 2024 por fin el NIST finalizó los estándares de
Post Quantum Cryptography precisamente porque el concenso de la comunidad
criptográfica es que el riesgo de esperar no vale la pena. Si llegas tarde, todo
lo que grabaron ya es legible.

La respuesta a esto es
_[ML-KEM-768](https://www.netmeister.org/blog/tls-hybrid-kex.html)_, el
algoritmo estandarizado en el
[NIST FIPS 203](https://csrc.nist.gov/pubs/fips/203/final). Este algorimo
inutiliza al algoritmo de Shor, pues no existe computadora cuántica (aún) que
sea capaz de resolverlo eficientemente. Aun así, el estándar es bastante joven y
puede ser que exista algún bug que no hayamos descubierto. La respuesta se llama
**KEM HÍBRIDO**, aquí combinamos _ML-KEM-768_ con _ECDH_ clásico (`X25519`) y
derivamos dos secretos: uno para autenticar el handshake y otro para la sesión
final con _forward secrecy_

```
kem_auth_secret = HKDF-SHA256(mlkem_shared_secret || x25519_shared_secret, info="bellbird-v1")
session_root    = HKDF-SHA256(kem_auth_secret || x25519_ephemeral_shared_secret, info="bellbird-v2 session-root")
```

La seguridad del sistema no depende de un único ladrillo y eso ayuda durante la
transición post-cuántica.

## SOCKS5 como capa de transporte

SOCKS5 ([RFC-1928](https://www.rfc-editor.org/rfc/rfc1928)) opera por debajo de
la capa de aplicación, interpone un _relay_ `TCP` transparente antes de que el
protocolo de aplicación emita un solo byte. Todo cliente que quiera conectarse
debe primero establecer una sesión `TCP` con el _relay_, completar un
_handshake_ y hasta que el _relay_ responde con `REP = 0x00` comienza el flujo
de bytes de la aplicación. El trabajo del relay es canalizar los payloads de
forma bi-direccional. Puede hacerlo sin inspeccionarlos, pero técnicamente sí
podría verlos si tú no usas cifrado de aplicación (HTTPS, SSH, etc).

SOCKS5 además tiene soporte para delegar la resolución `DNS` al _relay_, lo que
permite la resolución remota de nombres y es agnóstico al protocolo de
aplicación que lo atraviese, por lo que no se necesita mantener un interceptor
por cada protocolo que exista.

La delegación de DNS no es algo menor, si el cliente resolviera los nombres de
manera local, las peticiones DNS saldrían en claro antes de entrar al túnel y
eso te dejaría expuesto a cualquier observador que quiera ver a que dominios
estás conectad@ exactamente, aunque el contenido en si mismo vaya cifrado. Con
el tipo de dirección `DOMAINNAME` de SOCKS5 el nombre viaja dentro del túnel y
la resolución ocurre en el relay.

## Bellbird: Para nada silencioso

<div class="ok box">
  <strong class="titlebar">Talk is cheap, show me the code! 🐧</strong>
  Puedes encontrar el repositorio con el código fuente de este programa
  <a target="_blank" rel="noopener noreferrer" href="https://codeberg.org/urutau-ltd/bellbird">aquí</a>.
</div>

Con el problema claro, análisis de tráfico por metadatos, Harvest Now Decrypt
Later, correlación de timing, la pregunta es qué hace `bellbird` concretamente.
Son cuatro capas:

```
[app] ──SOCKS5──▶ [bell cliente 127.0.0.1:1080] ──túnel PQC──▶ [bell relay] ──▶ [destino]
                          │
               jitter + dummy packets + padding
               controlado por policy.zy (hot-reload on SIGHUP)
```

### Tunnel: Handshake PQC y framing

El handshake establece la clave de sesión sin que esa clave viaje jamás por la
red. El relay tiene un keypair estático generado una vez por el operador: 1184
bytes de clave pública _ML-KEM-768_ más 32 bytes de X25519, concatenados y
distribuidos a los clientes.

Cuando un cliente se conecta, el handshake ocurre en dos etapas:

```
ML-KEM:   mlkem_ct, mlkem_ss = ML-KEM-768.Encapsulate(relay_mlkem_pub)
X25519:   x25519_ss = X25519(client_kem_eph_priv, relay_static_x25519_pub)
kem_auth_secret = HKDF-SHA256(mlkem_ss || x25519_ss, info="bellbird-v1")

# Etapa 2: secreto efímero adicional para forward secrecy
fs_ss = X25519(client_fs_eph_priv, relay_fs_eph_pub)
session_root = HKDF-SHA256(kem_auth_secret || fs_ss, info="bellbird-v2 session-root")
```

El primer mensaje del cliente lleva:

```
[kem_len:2][kem_ciphertext:1120][client_fs_eph_pub:32]
```

Donde ese `kem_ciphertext` de 1120 bytes es:

```text
[mlkem_ciphertext:1088][client_kem_eph_pub:32]
```

Después, el relay responde con su clave efímera de FS y un tag HMAC del
transcript para autenticar su respuesta. Nunca viaja la clave de sesión final,
solo material para derivarla en ambos extremos.

A partir de ahí, cada frame del flujo tiene ese formato si se observa desde el
"wire":

```
[tipo : 1 byte][longitud_ciphertext : 2 bytes][nonce : 12 bytes][AES-GCM ciphertext]
```

Los primeros 15 bytes van en claro, pero son el AAD (Siglas de _Additional
Authenticated Data_)_: están autenticados por el GCM tag. Si alguien modifica el
byte de tipo en tránsito, la autenticación falla. El nonce es un contador
estrictamente creciente - si el relay recibe un frame con un nonce que ya
procesó, lo rechaza. Eso cierra los
[replay attacks](https://www.geeksforgeeks.org/computer-networks/replay-attack/).

Cada conexión SOCKS5 genera su propio túnel PQC independiente, con su propia
clave de sesión efímera. Comprometer la clave de una sesión no afecta a las
demás.

### El motor de Ruido: Tres defensas en paralelo

La primera pieza del motor es el _Padding a múltiplo de bloque_, aquí el payload
se rellena con ceros hasta el siguiente múltiplo de 512 antes de cifrar. Dos
frames de 17 y 510 bytes respectivamente son indistinguibles para un observador,
ambos saldrán como 512 bytes. Esto elimina el tamaño de paquete como feature
para el clasificador WF. Los paquetes pequeños tienen overhead alto (1 byte de
payload -> 512 bytes de salida), pero eso es deliberado: son los más
informativos en los modelos WF porque revelan el patrón de control de flujo.

La segunda pieza del motor es un _jitter_ configurable por política. Antes de
enviar cada frame, el motor consulta `packet_delay_ms` y duerme ese tiempo. El
policy por defecto usa un delay uniforme ligero (8 -22 ms), pero puedes
cambiarlo a una distribución exponencial u otro modelo según tu perfil de
riesgo.

La tercera pieza es la inyección de frames dummy. Una goroutine separada inyecta
frames de ruido con probabilidad configurable. Están cifrados con la misma clave
de sesión, pero el tipo de frame viaja en claro como parte del AAD, así que un
adversario que conozca el protocolo puede separarlos por tipo (`PacketData` vs
`PacketDummy`). Sirven para distorsionar patrones, pero no son invisibles.

### LISP. Made with secret alien technology!

Los tres parámetros antes mencionados son funciones en un script
[`zygomys`](https://github.com/glycerine/zygomys) un intérprete de LISP
incrustable en Go que vive en `policy.zy`. El motor llama tres funciones por
nombre en tiempo de ejecución y los nombres son exactos: `packet_delay_ms`,
`inject_dummy`, `pad_to_size`.

```lisp
; delay en ms antes de enviar cada frame
(defn packet_delay_ms []
  (+ 8 (* (rand) 14)))

; ¿inyectar un frame dummy ahora?
(defn inject_dummy []
  (< (rand) 0.12))

; tamaño objetivo para un payload de n bytes
(defn pad_to_size [n]
  (* 512 (ceil (/ (+ n 2) 512.0))))
```

Si quieres una política más agresiva, puedes usar `rand-exp` (builtin de
`bellbird`) y aumentar tanto delay como padding.

> Gracias Mistral, yo no podría haberlo interpretado mejor.

Y creo que ya se que estás pensando

> ¿Por qué demonios LISP en lugar de un JSON como configuración?

Porque en JSON no puedes escribir "distribución exponencial con parámetro λ".
Con LISP tienes un lenguaje de programación entero a tu servicio, puedes
escribir funciones reales, eso te permite ajustar el proxy dependiendo de tu
perfil de riesgo, para un periodista en una zona de riesgo por ejemplo el
tradeoff latencia/anonimato es distinto que alguien que desea ejecutar
`bellbird` para su celular solamente.

```lisp
; perfil de alto riesgo:
; - delay agresivo
; - más dummies
; - bloques más grandes
(defn packet_delay_ms []
  (+ 20 (* (rand-exp 0.25) 20)))

(defn inject_dummy [] (< (rand) 0.30))

(defn pad_to_size [n]
  (* 1024 (ceil (/ (+ n 2) 1024.0))))
```

Si el archivo cambia, puedes enviarle al proceso una señal `SIGHUP` con
`kill -HUP $(pgrep '^bell$' || pgrep '^bellbird$')` para recargar la política
sin interrumpir las conexiones activas. El swap del entorno Lisp en memoria está
protegido con un `sync.RWMutex`: Las goroutines de envío mantienen `RLock()`
durante cada llamada; el reload toma `Lock()` solo el instante del reemplazo.

### DNS protegidos

¿Recuerdas que te mencioné que SOCKS5 podía enviar queries de DNS y que las
mismas pasaban por el relay? Bueno, `bellbird` implementa solo `CMD = CONNECT`
(`0x01`). `BIND` y `UDP ASSOCIATE` quedan fuera deliberadamente: `BIND` requiere
que el proxy abra un puerto entrante en nombre del cliente, lo que complica el
modelo de amenaza; `UDP ASSOCIATE` introduce un canal que no pasaría por un
túnel PQC. El 99% de los casos de uso son `CONNECT` de todas formas.

El "wire" format del handshake completo, con bytes reales:

```text
# Greeting (cliente → relay)
05          ; VER = 5
01          ; NMETHODS = 1
00          ; METHOD = NO AUTHENTICATION REQUIRED

# Method selection (relay → cliente)
05          ; VER = 5
00          ; METHOD aceptado = NO AUTH

# Request (cliente → relay)
05          ; VER = 5
01          ; CMD = CONNECT
00          ; RSV
03          ; ATYP = DOMAINNAME (resolución delegada al relay)
0b          ; longitud del hostname = 11
6578616d706c652e636f6d  ; "example.com"
01 bb       ; PORT = 443 (big-endian)

# Reply (relay → cliente)
05 00 00 01 ; VER REP=success RSV ATYP=IPv4
00 00 00 00 ; BND.ADDR (no usado por bellbird)
00 00       ; BND.PORT  (no usado por bellbird)
```

A partir del reply exitoso, la conexión es un pipe `TCP` bi-direccional. En
`bellbird` ese pipe entra inmediatamente al framing AES-256-GCM del túnel PQC.

<div class="warn box">
  <strong class="titlebar">NOTA IMPORTANTE 📢</strong>
  Sobre la confianza local: El listener en <code>127.0.0.1:1080</code> confía implícitamente
  en cualquier proceso que se conecte desde el mismo host. En una máquina multiusuario eso puede
  ser un problema; en un setup personal es el tradeoff razonable para conseguir compatiblidad
  universal.
</div>

### Endurecimiento operativo

Además del túnel, hay dos defensas operativas que sí valen oro cuando esto se
expone fuera de tu LAN:

La primera es el _token de autenticación opcional_, si configuras `bellbird`
usando `--token` o `--token-file`, el relay exige una credencial al inicio de la
sesión. Esto evita que cualquiera use tu relay por accidente o abuso.

La segunda son las _guardias contra targets locales_. Por defecto, el relay va a
bloquear destinos `localhost`, `loopback`, `link-local`, `multicast` y
similares. Esto reduce riesgos de tipo SSRF/pivoting. Solo deberías usar
`--allow-local-targets` en laboratorio.

## Lo que aprendí de los demás: WTF-PAD, DAITA y Maybenot

`bellbird` no es una idea original, ni innova en absoluto. Vale la pena conocer
el trabajo de otras personas para entender los _tradeoffs_ de las decisiones de
diseño del proxy.

### Defensas contra Web Fingerprinting

Las defensas de ruido _WTF-PAD_, _FRONT_ inyectan paquetes dummy o añaden delay
para contaminar la señal. _WTF-PAD_ rellena los agujeros entre _bursts_ sin
añadir latencia; _FRONT_ concentra el ruido en los primeros paquetes de la
sesión porque son los más informativos. Tienen menor overhead pero comparten un
problema: sus parámetros son estáticos y conocidos. Un clasificador entrenado
sobre tráfico ya defendido con _WTF-PAD_ aprende a ignorar este patrón de ruido
específico. Las CNNs de 2018 ya rompían _WTF-PAD_.

Las defensas de regularización como _RegulaTor_ o _Palette_, en lugar de añadir
ruido, mapean el tráfico de cada sitio a un patrón preestablecido para que
distintos sitios parezcan iguales. Son más robustas en teoría pero el overhead
de ancho de banda y latencia puede ser prohibitivo - _RegulaTor_ puede duplicar
el tiempo de carga. _Palette_ (IEEE S&P 2024) mejora esto generando conjuntos de
anonimato; grupos de sitios con patrones similares que se mapean entre si en
lugar de mapearse todos a un único patrón global.

### DAITA y Maybenot

En mayo de 2024, Mullvad anunció _DAITA_ en colaboración con la Universidad de
Karlstad. Fue la primera implementación a escala de producción de defensa contra
análisis de tráfico guiado por IA: normalización de tamaño de paquetes,
inyección de dummy traffic y distorsión de patrones de bursts.

El framework subyacente tiene como nombre _maybenot_: máquinas de estado
probabilísticas que observan el tráfico en tiempo real y deciden cuando inyectar
cobertura. Las máquinas son componibles y se pueden despegar sin recompilar el
cliente.

La mejora más interesante llegó con DAITA v2 (Marzo 2025): en lugar de usar un
conjunto fijo de máquinas en el cliente, el cliente ahora recibe parámetros del
servidor en cada reconexión, estos parámetros se eligen aleatoriamente de una
base de datos de máquinas diseñadas para máxima entropía. Dos sesiones al mismo
tiempo pertenecen a flujos distintos. Si un adversario aprende la distribución
v2, Mullvad puede generar nuevas máquinas sin actualizar los clientes.

## ¿Por qué bellbird no usa Maybenot?

_Maybenot_ es bastante superior. Entonces ¿por qué no?

`bellbird` está diseñado para ser _self-hosted_ por individuos o grupos
pequeños. _maybenot_ como framework puede integrarse de varias formas, pero el
esquema dinámico estilo DAITA v2 sí requiere coordinación cliente-servidor y un
catálogo de configuraciones que va cambiando. Para un relay personal en un VPS
esa complejidad operativa es una barrera real. La política de LSIP de `bellbird`
es más sencilla y menos robusta contra adversarios con modelos entrenados
específicamente para aumentar el costo operacional de forma significativa.

## Bellbird no te protegrá de:

- No oculta que estás usando el propio bellbird. El primer saludo tiene una
  firma de protocolo bastante reconocible (componentes ML-KEM + claves efímeras
  X25519), una secuencia inusual que no corresponde a ningún protocolo comercial
  conocido. En entornos donde el tráfico puede ser bloqueado por reconocimiento
  de protocolo haría falta "pluggable transports" que disfracen el tráfico como
  TLS normal; fuera del alcance de `bellbird`.

- No oculta el destino al relay, por lo que el relay siempre sabe a que servidor
  te conectas. Si el operador es malicioso o está vulnerado, puede registrar esa
  información y, si no usas cifrado de aplicación, también inspeccionar
  payloads.

- No protege la capa de aplicación, es decir, cookies, user-agent, canvas
  fingerprinting, WebGL y cualquier identificador que una determinada aplicación
  envíe, viaja dentro del túnel cifrado pero el destino lo ve igual. `bellbird`
  opera en TCP y no toca el payload.

- La política de ruido es estática entre sesiones. A diferencia de DAITA v2,
  todas las sesiones usan la misma política hasta que el operador recarga con
  `SIGHUP`. Con suficientes sesiones grabadas, un adversario puede aprender la
  distribución del ruido y diseñar un clasificador que la considere.

- No es Tor. No sirve para anonimato. Esto es un proxy de un hop. Para mejor
  privacidad, combínalo con Tor o I2P, no los reemplaces.

## Uso de Bellbird

### Para operar un relay

```bash
$ bellbird keygen --out relay
# -> relay.pub (Entrega esto a tus clientes)
# -> relay.key (Debe estar bien protegida)

# opcional pero recomendado
$ printf '%s\n' 'reemplaza-esto-por-un-secreto-largo' > relay.token
$ chmod 600 relay.token

$ bellbird relay --key relay.key \
    --listen :9001 \
    --token-file relay.token
```

### En tu máquina

```bash
$ bellbird client --relay <ip>:9001 \
    --pubkey relay.pub \
    --policy policy.zy \
    --token-file relay.token \
    --listen 127.0.0.1:108
```

Instalación

```bash
$ go install codeberg.org/urutau-ltd/bellbird/cmd/bellbird@latest
```

O con el binario corto `bell` desde el repo:

```bash
$ make build
```

Con el cliente corriendo, cualquier aplicación que soporte SOCKS5 funciona:

```bash
$ curl --socks5 localhost:1080 https://urutau-ltd.org/

# Git
$ git config --global http.proxy socks5://localhost:1080
$ git config --global https.proxy socks5://localhost:1080

# ssh
# En ~/.ssh/config:
# Host servidor
#    ProxyCommand nc -x localhost:1080 %h %p
```

## Descargo de responsabilidad

Este software fue escrito con un propósito específico: proteger a personas que
necesitan privacidad legítima frente a vigilancia. La privacidad no es
sospechosa. Cerrar la puerta de tu casa no significa que estés haciendo algo
ilegal adentro.

Aquí todos somos adultos, o en otras palabras, _"aquí nadie se chupa el dedo"_:
las herramientas de privacidad pueden ser usadas para fines dañinos. **No**
pretendemos que eso no es cierto, Lo que creemos es que el balance — proteger a
periodistas, activistas y ciudadanos de la vigilancia masiva — justifica la
existencia de estas herramienta

## ἐπίλογος (Epílogo)

Si te interesa `bellbird`, opera un relay privado solo para ti y personas en
quienes confíes. La vigilancia masiva es un problema. Las herramientas de
privacidad son una respuesta parcial e individual. La respuesta completa
requiere política pública, organizaciones como [EFF](https://www.eff.org/), la
[FSF](https://www.fsf.org/) y [Access Now](https://www.accessnow.org/),
periodismo de investigación, y presión política. Este software es un pequeño
ladrillo en una construcción mucho más grande que también necesita de ti, que
estás leyendo esto.

Visto desde un punto de vista práctico, es cierto que para muchas personas es
muy difícil deshacerse de los hábitos tecnológicos que han forjado por años. Sin
embargo, también quiero recalcar que, cualquier paso, por pequeño que sea,
mientras sea hacia el objetivo de conservar tu libertad y tu privacidad, es
bueno. En palabras de _Richard Stallman_:

> _"Un recorrido de miles de kilómetros consta de una infinidad de pasos. Cada
> vez que alguien no instala un programa privativo o decide no ejecutarlo ese
> día, está dando un paso hacia su propia libertad [...] Puede dar un primer
> paso, y una vez que lo haya hecho, en cualquier otro momento puede dar otro
> más. Es posible que con el tiempo descubra que sus hábitos han cambiado." ~
> [Decir no a la informática injusta aunque sea una sola vez es siempre de ayuda](https://www.gnu.org/philosophy/saying-no-even-once.es.html)_

Se necesita de imaginación que cubra todos los ángulos posibles, para diseñar
soluciones que eleven drásticamente los costos operativos de vigilancia:
sistemas distribuidos y heterogéneos, protocolos que favorezcan el cifrado punto
a punto por defecto, diversidad de implementaciones interoperables, uso
estratégico de metadatos reducidos, mezcladores de tráfico y prácticas que
aumenten la necesidad de recursos, tiempo y riesgo legal por parte de quienes
sean los vigilantes.

Recuerda, nadie está negando que estas herramientas pueden y, no nos hagamos de
la vista gorda, han sido usadas para perjudicar a otros en el pasado. Sin
embargo, esto no significa que todos los individuos que defienden su derecho a
la privacidad hayan hecho un mal uso de estas herramientas. Como toda
herramienta su función es clara y es imparcial, puedes crear tantas cosas como
las que puedes destruir con un martillo. No estoy aquí para darte una lección de
moralidad, mi consejo es que hagas uso de estas herramientas, de una forma en la
que puedas irte a dormir tranquil@ por la noche, sabiendo que sometiste a juicio
tu decisión, evaluaste daños y beneficios y actuaste con responsabilidad hacia
quienes podrían verse afectados.

Y si ya tenías interés previo en el tema o llegaste aquí por casualidad, espero
que al menos te lleves una cosa: La privacidad no se va a defender con fe, hay
que tomar decisiones técnicas y hábitos _"incómodos"_.

¿Cuál es tu opinión? ¿Has tomado pasos para proteger tu privacidad últimamente?
Me gustaría saber tu opinión en el formulario de contacto. Muchas gracias por
leer este artículo :) si te gustó o te pareció interesante te pido lo compartas
con tus amigos o con quien creas que podría interesarle el tema.

## Referencias y lectura adicional

- Estándares de criptografía
  - [NIST (2024): aprobación oficial de FIPS 203/204/205](https://www.nist.gov/news-events/news/2024/08/announcing-approval-three-federal-information-processing-standards-fips)
  - [NIST FIPS 203 - ML-KEM](https://csrc.nist.gov/pubs/fips/203/final)
  - [NIST FIPS 204 - ML-DSA](https://csrc.nist.gov/pubs/fips/204/final)
  - [RFC 9180 - Hybrid Public Key Encryption](https://www.rfc-editor.org/rfc/rfc9180)

- Ataques de website fingerprinting
  - [Sirinam et al., Deep Fingerprinting (arXiv:1801.02265)](https://arxiv.org/abs/1801.02265)
    — 98%+ en escenario cerrado sin defensas.
  - [Deng et al., Holmes (arXiv:2407.00918)](https://arxiv.org/abs/2407.00918) —
    identificación temprana en dark web con ~21.71% de carga promedio en su
    evaluación.
  - [Deng et al., Beyond a Single Perspective (arXiv:2510.14283)](https://arxiv.org/abs/2510.14283)
    — evaluación realista donde varios ataques se degradan fuera de laboratorio.

- Defensas
  - [Mullvad Introducing DAITA](https://mullvad.net/en/blog/introducing-defense-against-ai-guided-traffic-analysis-daita)
  - [Mullvad DAITA](https://mullvad.net/en/vpn/daita)

- Harvest Now, Decrypt Later / Vigilancia documentada
  - [EFF: NSA Spying](https://www.eff.org/nsa-spying)
  - [NSA XKeyscore](https://archive.org/details/nsa-xkeyscore)
  - [NSA Suite B transition announcement (2015)](https://web.archive.org/web/20150810135143/https://www.nsa.gov/ia/programs/suiteb_cryptography/)
  - [NSA/CISA/NIST (2023): migración a criptografía post-cuántica](https://www.nsa.gov/Press-Room/Press-Releases-Statements/Press-Release-View/article/3498776/post-quantum-cryptography-cisa-nist-and-nsa-recommend-how-to-prepare-now/)

- Privacidad y libertad del software (FSF/GNU) — recomendadas
  - [FSF: campaña contra la vigilancia masiva](https://www.fsf.org/campaigns/surveillance/)
  - [FSF: Email Self-Defense (cifrado de correo con OpenPGP)](https://emailselfdefense.fsf.org/en/)
  - [FSF: declaración sobre PRISM (2013)](https://www.fsf.org/news/free-software-foundation-statement-on-prism-revelations)
  - [FSF: reformar la vigilancia corporativa](https://www.fsf.org/news/reform-corporate-surveillance)
  - [FSF: “We have nothing to hide, only everything to protect”](https://www.fsf.org/blogs/community/we-have-nothing-to-hide-only-everything-to-protect)
  - [FSF: “Privacy and freedom should be the legacy we leave…”](https://www.fsf.org/blogs/community/privacy-and-freedom-should-be-the-legacy-we-leave-not-the-opposite)
  - [FSF: “Ring offers mass surveillance” (2026)](https://www.fsf.org/blogs/community/2026-ring-offers-mass-surveillance)
  - [FSF: campaña FreeJS (control del usuario en el navegador)](https://www.fsf.org/campaigns/freejs/)
  - [GNU: FAQ sobre vigilancia](https://www.gnu.org/philosophy/surveillance-faq.html)
  - [GNU: ¿A quién sirve realmente ese servidor?](https://www.gnu.org/philosophy/who-does-that-server-really-serve.html)
  - [GNU: The JavaScript Trap](https://www.gnu.org/philosophy/javascript-trap.html)
  - [GNU: filosofía del proyecto (índice)](https://www.gnu.org/philosophy/)

- Bibliotecas usadas para `bellbird`:
  - https://github.com/cloudflare/circl
  - https://github.com/glycerine/zygomys

¡Gracias por leer el blog de Urutaú Limited! 🖤🦉
