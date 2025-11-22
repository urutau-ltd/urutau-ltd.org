---
title: Pruebas de procedencia ¿Qué demonios son?
description: Como la verificación de redes sociales, pero con valor real.
sample: "Hablaremos de SLSA, pruebas de procedencia y como puedes aplicar los
    conceptos aprendidos aquí como desarrollador de código libre."
date: 2025-11-15
author: FuncProgLinux
image: "/posts/tutorials/@/index.png"
draft: false
tags:
    - SLSA
    - DevOps
    - Security
    - DevSecOps
    - Go
    - Podman
---

<details>
    <summary>Índice:</summary>
    <!-- Don't forget the newline before and after [[toc]]!!! -->

    [[toc]]

</details>

Si comenzaste a trabajar o tienes interés en trabajar en tecnologías que tengan
relación con la parte _DevOps_ del mundo moderno, sería útil para ti conocer un
poco más sobre la procedencia del software y cómo se usa a nivel productivo.
¿Quién sabe? Quizás podría ser de utilidad para ti a nivel personal o en tu
trabajo. El secreto, está en la _salsa_. La ciberseguridad cada vez abarca más
cosas y el código ahora solo es un aspecto de la misma, hemos desplazado la
necesidad de proteger nuestra computación hasta la cadena de suministro de
software, un actor de riesgo ya no necesita gastar toda su energía para
encontrar un error de memoria en tu preciado programa escrito en `rust`, si el
mismo logra corromper tu entorno de compilación puede inyectar payloads en uno o
varios artefactos finales.

## SLSA

El acrónimo _S.L.S.A_ en idioma inglés se utiliza para referirse a _Supply-chain
Levels For Software Artifacts_, el mismo es un marco de trabajo de seguridad y
un conjunto de estándares para proteger la integridad del software. A estas
alturas de la historia de la humanidad, los ataques a la cadena de suministro
con software adulterado no son **para nada** nuevos:

- El [fiasco](https://lwn.net/Articles/967194/) en las utilidades `xz`.

- Cuando a los usuarios de `npm` se les
  [olvidó como programar](https://www.theregister.com/2016/03/23/npm_left_pad_chaos/)
  _string prepending_ y el paquete de 15 líneas que necesitaban rompió miles de
  entornos.

- El
  [ataque](https://www.akamai.com/blog/security/polyfill-supply-chain-attack-what-to-know)
  a los sitios dependientes de `polyfill.io` que impactó miles de sitios web.

- La [protesta](https://github.com/ardeois/faker.js) del creador de Faker.js
  mencionando a
  [Aaron Swartz](https://www.internethalloffame.org/inductee/aaron-swartz/). Se
  podría considerar como _adulterado_ debido a la eliminación de las funciones
  originales del paquete.

- En general cualquier lenguaje de programación que te permita usar módulos o
  bibliotecas escritas por terceros es suceptible a este tipo de ataques.
  [Por alguna razón en particular](https://www.enterprisesecuritytech.com/post/typosquatting-campaign-hits-go-ecosystem-malicious-packages-target-developers-with-hidden-malware)
  `go` y `node` son un imán de problemas de este tipo.

SLSA se encarga de darnos un lenguaje común, una lista de pasos y comprobaciones
que podemos ejecutar metódicamente para verificar la integridad de nuestro
software desde su concepción como código lleno de _bugs_ hasta su etapa
productiva en servidor o como binario ejecutable...igual de lleno de bugs. Y
quiero hacer énfasis en eso, SLSA no es magia o algo parecido, no es para
asegurar la calidad del código en si mismo, si no la calidad y la autenticidad
de los _artefactos_ de un programa en particular.

<figure>
    <img class="urutau-logo" src="/img/artifact.webp" />
    <figcaption>
            Al mencionar la palabra "Artefacto" o "Artefactos"
            no puedo evitar pensar en los artefactos chozo de
            <a href="https://es.wikipedia.org/wiki/Metroid_Prime">
                    Metroid Prime.
            </a>
            Comparten algunas similitudes como ser abstractos y por lo tanto
            solo visibles a través de una representación como un dibujo, pues
            son amorfos por definición.
    </figcaption>
</figure>

Un uso _"del mundo real"_ que puedes darle a SLSA es a nivel _First Party_, es
decir, utilizar el estándar y sus prácticas dentro de una organización, sea
lucrativa o voluntaria para reducir el riesgo de software adulterado en las
fuentes internas. Como emprendimiento puede ser utilizado para asegurarse que el
código que se despliegue al entorno productivo sea el mismo que el utilizado en
las fases de pruebas y desarrollo. O si es un proyecto voluntario como lo es el
software libre, puede utilizarse para evitar abuso en caso de que las
credenciales de uno o más contribuidores resulten vulneradas. Al final del día,
escribir código seguro **NO ES SUFICIENTE** si el proceso de construcción está
comprometido. El ataque que sufrió
[SolarWinds](https://www.crowdstrike.com/en-us/blog/sunspot-malware-technical-analysis/)
nos enseña que puedes tener el código fuente más pristino del mundo y eso no te
salva de que alguien inyecte malware en el proceso de compilación, al contrario,
es casi poético que termines distribuyendo un troyano firmado legítimamente.

Vamos a aclarar otra cosa, las cosas no son binarias con SLSA, es decir no
declaras algo como "seguro" o "inseguro" directamente. Para ello se establecen
cuatro (4) niveles (del 0 al 3) de madurez de seguridad:

> Fuente: https://slsa.dev/spec/v1.1/levels

| Track/Nivel | Requerimientos                                                                                            | Enfoque                                     |
| ----------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Build L0    | (Ninguno)                                                                                                 | (n/a)                                       |
| Build L1    | Procedencia mostrando _como_ se construyó el paquete                                                      | Errores, Documentación                      |
| Build L2    | Procedencia _firmada_, generada por una plataforma de construcción alojada por ti mism@ o por alguien más | Adulteramiento en el tiempo de construcción |
| Build L3    | Plataforma de construcción endurecida                                                                     | Adulteramiento en el tiempo de construcción |

En algunos casos los _Build Lx_ suelen llamarse _SLSA X_ donde en ambos casos
`X` es el nivel de seguridad. Por ejemplo, en algunos artículos, tutoriales o
herramientas podrías leer `SLSA 3` en lugar de `SLSA Build L3`. El nivel
`SLSA 3` suele ser el estándar _de oro_ para CI/CD. El nivel 4 suele ser un poco
más costoso a nivel infraestructura, pues son necesarios servidores de
construcción aislados.

Para cumplir con SLSA 1 es necesari oque la prueba de procedencia se más que un
simple archivo `.asc`. Debe ser una atestación
[in-toto](https://slsa.dev/blog/2023/05/in-toto-and-slsa).

### In-¿Que?

[In-Toto](https://github.com/in-toto/attestation/) es un _framework_ que define
cómo crear y verificar la integridad de los pasos en una determinada cadena de
suministro de software. La atestación de procedencia (a falta de un término que
pueda traducir mejor) es un archivo `.intoto.jsonl` que contiene un objeto JSON
firmado digitalmente, compuesto de dos partes críticas:

1. `Statement`: Metadatos sobre un artefacto X (SHA256, URL, etc)
2. `Predicate`: Esta sección detalla el `builder`, los detalles del entorno de
   ejecución, los metadatos como el inicio y término de la construcción, etc.

Puedes leer más sobre la procedencia de `in-toto`
[aquí](https://slsa.dev/spec/v1.1/provenance)

En GitHub, la atestación suele ser firmada usando OIDC
([OpenID Connect](https://openid.net/developers/how-connect-works/)). Esto
significa que, a diferencia de tus ajustes de desarrollador, no necesitas
administrar llaves `ssh` o `gpg` para firmar las cosas. En el caso particular de
GitHub, el mismo actúa similar a una CA (Por sus siglas _Certificate Authority_)
para tu servidor de construcción, delegando una prueba criptográfica que el
artefacto solo pudo haber sido generado por una
_[Workflow run](https://docs.github.com/en/actions/how-tos/manage-workflow-runs)_
en específico.

> Apesta a tecnicismos en Inglés, lo se. La mayoría de recursos de estas cosas
> se encuentran escritos en ese idioma. Báncame.

## Procedencia (provenance)

La _procedencia_ (sosteniendo el contexto de SLSA) es el metadato autenticado
que vincula un **artefacto** (Un archivo `X` sea texto o binario. Pueden ser
ejecutables `ELF` o `.exe` incluso imagenes OCI de `docker` o `podman`) con su
fuente (el repositorio de `git` o `mercurial` y su commit específico) y el
constructor, que en la mayoría de los casos es el entorno donde se ejecutan las
pruebas de `CI/CD`. Como puedes apreciar, esto apesta a DevOps y lo es.

Para que la procedencia sea útil, debe cumplir con el
[nivel 3](https://slsa.dev/spec/v1.1/levels#build-l3-hardened-builds) de la
especificación de construcciones reproducibles, lo que quiere decir que el o los
artefactos de tu proyecto deben ser:

1. **In-falsificables**: Firmados criptográficamente.
2. **Generado/Generados por el servicio**: No debe haber **ninguna**
   intervención manual es GitHub, GitLab, Woodpecker, Jenkins o cualsea el
   servicio el que debe certificar la construcción del artefacto, no tu laptop.

## Ejemplo práctico: SLSA con Go y Docker

No existe forma de aprendizaje que se le compare al _"learning by doing"_. Y
justo eso es lo que vamos a hacer. Vamos a crear un `workflow` de GitHub donde
cada vez que hagamos un _release_, se genere un binario y una atestación de
procedencia del mismo verificable.

<div class="ok box">
  <strong class="titlebar">Talk is cheap, show me the code! 🐧</strong>
  Puedes encontrar el repositorio con el código fuente de este ejemplo
  <a target="_blank"
    rel="noopener noreferrer"
    href="https://github.com/FuncProgLinux/wtf-is-provenance">aquí</a>.
</div>

### El código

Esto viene importando poco o nada, yo por rellenar este artículo hice una REST
extremadamente sencilla, pero incluso eso es demasiado, debería bastar con el
_"Hola Mundo"_ de toda la vida.

```go
package main

import (
	"log"
	"net/http"
)

func main() {
	mux := http.NewServeMux()
	mux.Handle("/", &homeHandler{})

	log.Println("Listening at http://0.0.0.0:8001")
	http.ListenAndServe(":8001", mux)
}

type homeHandler struct{}

func (h *homeHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("Nyctibius Griseus"))
}
```

Solo asegurate de tener un programa escrito en `go` que se compile
correctamente. Yo haré referencias al código del repositorio que mencioné
anteriormente.

### Flujo de trabajo con GitHub Actions

Esta es la parte importante del artículo cuando tengas tu código funcional y
listo para usarse. Es momento de crear los pipelines necesarios para su
construcción y despliegue. Vamos a ver primero el lado de `go` y como sería un
pipeline para construir y verificar la procedencia del artefacto final.

Primero, en la raíz de nuestro repositorio debemos crear un archivo con el
nombre `.slsa-goreleaser.yml` para configurar la salida de construcción que
queremos:

```yml
---
version: 1

env:
    - CGO_ENABLED=0

goos: linux
goarch: amd64

binary: app-{{ .Os }}-{{ .Arch }}
ldflags:
    - "-s"
    - "-w"
...
```

Para no abrumarte aún más con conceptos que van más allá del alcance de este
artículo, vamos a explicar de forma resumida este archivo de configuración:

1. Declaramos `CGO_ENABLED=0` para crear binarios 100% estáticos de Go.
2. Solo le daremos soporte a GNU/Linux en arquitecturas de 64 bits.
3. El binario tendrá como nombre `app` seguido del sistema operativo para el que
   fue construido, es decir, en este caso en particular tendrá como nombre
   `app-linux-amd64`, lo mismo aplicará para los otros artefactos generados por
   el releaser, como el archivo `.jsonl` que mencionamos antes cuando explicamos
   _in-toto_, aquí tendrá por nombre `app-linux-amd64.intoto.jsonl`

Dependerá de ti como lleves las notaciones de tu software y las arquitecturas
que desees soportar. Toma en cuenta que, la salida de ensamblador de Go será muy
diferente entre `amd64` y `ppc64le` (_PowerPC Little Endian_), por lo que,
aunque sean binarios estáticos, la reproducibilidad **no** está garantizada. Lo
mismo para los sistemas operativos donde vaya a usarse.

La especificación para este archivo se encuentra
[aquí](https://github.com/slsa-framework/slsa-github-generator/blob/main/internal/builders/go/README.md#configuration-file).
Y sus opciones no están limitadas a lo que observas en este ejemplo, puedes
extender este archivo para que la compilación se realice para Mocosoft Windows,
MacOS y GNU/Linux al mismo tiempo. Al igual que puedes indicar las arquitecturas
que sean soportadas por Go:

```yml
# Para distintos sistemas operativos
goos:
    - windows # Mocosoft Windows
    - linux # GNU/Linux
    - darwin # MacOS

# Para distintas arquitecturas
goarch:
    - amd64
    - arm64
    - s390x
```

Ahora si, con este archivo de configuración a nuestro gusto, podemos comenzar
con el pipeline. Yo trabajaré en el mio dentro de la ruta
`.github/workflows/slsa-release.yml`:

```yml
---
name: SLSA Releaser

# Queremos ejecutar este workflow solo cuando creemos un tag y lo empujemos a
# GitHub. En teoría si Gitea es compatible, este workflow debería funcionar
# correctamente.
#
# Por ejemplo:
# $ git tag v1.0.0
# $ git push origin v1.0.0
on:
    push:
        tags:
            - "v*"

# Permisos de lectura laxos. Lo ideal es que los reduzcas de ser necesario
# salvo que tengas plena confianza de que las Actions que invocarás más
# adelante solo accederán a lo que les compete.
permissions: read-all

jobs:
    build:
        # De acuerdo a la documentación del go builder, estos permisos son
        # necesarios.
        permissions:
            id-token: write
            contents: write
            actions: read
        uses: slsa-framework/slsa-github-generator/.github/workflows/builder_go_slsa3.yml@v2.1.0
        with:
            # Podría cambiar en el futuro. Ajustalo a la versiń de Go que tienes.
            go-version: 1.25

    attest-release:
        name: Publish release attestations
        runs-on: ubuntu-latest
        needs: build
        permissions:
            contents: read
            id-token: write
            attestations: write
        env:
            GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        steps:
            - name: Checkout repository
              uses: actions/checkout@v4

            - name: Download release assets
              id: download-release
              run: |
                  set -euo pipefail
                  mkdir -p dist
                  if ! gh release view "${{ github.ref_name }}" >/dev/null 2>&1; then
                      echo "skip=true" >> "$GITHUB_OUTPUT"
                      echo "No GitHub release found for tag ${{ github.ref_name }}, so there's nothing for this attestation parade."
                      exit 0
                  fi
                  gh release download "${{ github.ref_name }}" --dir dist --clobber
                  if [ -z "$(ls -A dist)" ]; then
                      echo "skip=true" >> "$GITHUB_OUTPUT"
                      echo "Release exists but contains no assets to attest—classic."
                  else
                      echo "skip=false" >> "$GITHUB_OUTPUT"
                      ls -al dist
                  fi

            - name: Create release attestations
              if: steps.download-release.outputs.skip != 'true'
              # Enviar todos los assets descargados hacia la acción de atestación
              # para que los consumidores puedan verificarlos sin recurrir a logs
              # externos.
              uses: actions/attest-build-provenance@v1
              with:
                  subject-path: "dist/**"
...
```

Puedes ver en acción las actions
[aquí](https://github.com/FuncProgLinux/wtf-is-provenance/actions/runs/19548909424):

![image](/img/slsa-releaser.png)

Debajo podemos los artefactos producidos en la ejecución de este workflow en
específico:

![image](/img/artifacts.png)

Si nos dirigimos a la página de
[atestaciones](https://github.com/FuncProgLinux/wtf-is-provenance/attestations)
podremos observar los mismos artefactos siendo listados:

![image](/img/attested-artifacts.png)

Si ingresamos, por ejemplo a la atestación de
[app-linux-amd64](https://github.com/FuncProgLinux/wtf-is-provenance/attestations/13705668)
serán visibles para nosotros todos los metadatos que mencionamos anteriormente
como el commit desde el que se construyó el artefacto, el `ref` (tag) y detalles
del certificado:

![image](/img/go-app-attest.png)

### Flujo de trabajo con GitHub Actions para Podman (Imágenes OCI)

Compilar una imagen OCI (Docker/Podman) es diferente; el generador de SLSA
necesita el digest (el SHA256) de la imagen final antes de firmar la atestación.

De las atestaciones que vamos a ver en este artículo este es el archivo más
extenso y más problemático. Yo opté por mandar a volar a `docker` y su `buildX`
por su malhechura en los pasos para subir y comprobar una imagen OCI en los
pipelines. Procederemos con `podman` y `buildah` en este caso, te animo a
probarlos y que descubras una herramienta 100% compatible con Docker pero con
muchos de sus errores de diseño corregidos, hagamos las cosas en dos pasos:

1. Construir/subir la imagen
2. Generar la procedencia por separado.

Usaremos las siguientes Actions de Red Hat:

- [buildah-build](https://github.com/redhat-actions/buildah-build)
- [push-to-registry](https://github.com/redhat-actions/push-to-registry)
- [podman-login](https://github.com/redhat-actions/podman-login)

```yml
---
name: SLSA Docker Release

# Similar al workflow anterior. Solo ejecutaremos este
# archivo cuando hagamos push a un tag de git.
#
# De esta forma generaremos la atestación para los
# binarios ejecutables y para la imágen OCI
on:
    push:
        tags:
            - "v*"

# Los permisos globales de este jobset podrían no ser los que buscas. Sin
# embargo, creo que esto sigue el principio de "least-privilege" ya que,
# las actions que vamos a usar necesitan interactuar con los paquetes
# y con las atestaciones.
permissions:
    contents: read
    id-token: write
    packages: write
    actions: read
    attestations: write

env:
    IMAGE_NAME: tinyapi
    REGISTRY: ghcr.io

jobs:
    build-and-push-image:
        name: Build and Push Image to GitHub Container Registry
        runs-on: ubuntu-latest
        outputs:
            # Exponer la imagen, digest y nombre de usuario para que los trabajos
            # más abajo no deban re-evaluar YAML innecesariamente
            image_path: ${{ steps.image-meta.outputs.image_path }}
            digest: ${{ steps.push-to-ghcr.outputs.digest }}
            registry_username: ${{ steps.image-meta.outputs.actor }}
        steps:
            - name: Checkout Code
              uses: actions/checkout@v4

            - name: Set image metadata
              id: image-meta
              run: |
                  OWNER="${{ github.repository_owner }}"
                  OWNER="${OWNER,,}"
                  ACTOR="${{ github.actor }}"
                  ACTOR="${ACTOR,,}"
                  IMAGE_NAME="${{ env.IMAGE_NAME }}"
                  REGISTRY="${{ env.REGISTRY }}"
                  IMAGE_PATH="${REGISTRY}/${OWNER}/${IMAGE_NAME}"
                  echo "owner=${OWNER}" >> "$GITHUB_OUTPUT"
                  echo "actor=${ACTOR}" >> "$GITHUB_OUTPUT"
                  echo "image_name=${IMAGE_NAME}" >> "$GITHUB_OUTPUT"
                  echo "image_ref=${OWNER}/${IMAGE_NAME}" >> "$GITHUB_OUTPUT"
                  echo "image_path=${IMAGE_PATH}" >> "$GITHUB_OUTPUT"
                  echo "release_tag=${{ github.ref_name }}" >> "$GITHUB_OUTPUT"
                  echo "latest_tag=latest" >> "$GITHUB_OUTPUT"

            - name: Build with Buildah
              uses: redhat-actions/buildah-build@v2
              # Construimos una vez y asignamos tags dos veces (el tag para el
              # release y el tag "latest") y subimos ambas referencias.
              with:
                  image: ${{ steps.image-meta.outputs.image_ref }}
                  tags: |
                      ${{ steps.image-meta.outputs.release_tag }}
                      ${{ steps.image-meta.outputs.latest_tag }}
                  containerfiles: |
                      ./Dockerfile

            - name: Login to ghcr.io
              uses: redhat-actions/podman-login@v1
              with:
                  registry: ${{ env.REGISTRY }}
                  username: ${{ steps.image-meta.outputs.actor }}
                  password: ${{ secrets.GITHUB_TOKEN }}

            - name: Push to GitHub Container Registry
              id: push-to-ghcr
              uses: redhat-actions/push-to-registry@v2
              with:
                  image: ${{ steps.image-meta.outputs.image_ref }}
                  tags: |
                      ${{ steps.image-meta.outputs.release_tag }}
                      ${{ steps.image-meta.outputs.latest_tag }}
                  registry: ${{ env.REGISTRY }}

            - name: Create GitHub attestation
              uses: actions/attest-build-provenance@v1
              with:
                  subject-name: ${{ steps.image-meta.outputs.image_path }}
                  subject-digest: ${{ steps.push-to-ghcr.outputs.digest }}

            - name: Print image url
              run: |
                  echo "Image pushed to ${{ steps.push-to-ghcr.outputs.registry-paths }}"

    attest-image:
        needs: [build-and-push-image]
        permissions:
            contents: write
            id-token: write
            actions: read
            packages: write

        uses: slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml@v2.1.0
        with:
            image: ${{ needs.build-and-push-image.outputs.image_path }}
            digest: ${{ needs.build-and-push-image.outputs.digest }}
            registry-username: ${{ needs.build-and-push-image.outputs.registry_username }}
            continue-on-error: true
        secrets:
            registry-password: ${{ secrets.GITHUB_TOKEN }}
...
```

## Si no hay verificación, lo que hicimos fue perder el tiempo

La seguridad (en este caso específico) se define por la verificabilidad de
nuestros artefactos. El proceso no está completo hasta que un consumidor pueda
confirmar que el artefacto que está descargando corresponde exactamente a la
procedencia generada por el entorno de CI/CD. En nuestro caso, la procedencia
que generó GitHub en el entorno de las Actions.

Para esto, utilizamos la herramienta
[`slsa-verifier`](https://github.com/slsa-framework/slsa-verifier). Si no la
tienes instalada en tu sistema, ingresa al enlace anterior para instalarla en tu
sistema. Si estás usando el repositorio de ejemplo que te dejé al inicio del
tutorial y estás usando GNU Guix, puedes simplemente ejecutar `make env` para
crear un entorno vitual con la herramienta `slsa-verifier` preinstalada.

### El Proceso de Verificación

Al verificar, el verifier realiza tres comprobaciones esenciales que cumplen con
la especificación SLSA:

- **Firma Criptográfica**: El verifier comprueba que la atestación .intoto.jsonl
  no fue manipulada, verificando la firma OIDC de GitHub.
- **Vinculación del Fuente**: Verifica que el campo predicate.materials del JSON
  coincida con el repositorio y el commit (`--source-uri`, `--source-tag`).
- **Identidad del Constructor**: Asegura que el artefacto fue generado por el
  builder esperado y no por una fuente externa.

```bash
# Descargar el binario/imagen y el archivo *.intoto.jsonl

$ slsa-verifier verify-artifact \
--provenance-path app-linux-amd64.intoto.jsonl \
--source-uri github.com/FuncProgLinux/wtf-is-provenance \
--source-tag v0.1.15 \
app-linux-amd64
```

Si `slsa-verifier` pudo comprobar correctamente el binario anterior deberás
obtener la siguiente salida:

```bash
Verified build using builder "https://github.com/slsa-framework/slsa-github-generator/.github/workflows/builder_go_slsa3.yml@refs/tags/v2.1.0" at commit 474b781c3c0fe90ba91b773321630707a0a2dfd4
Verifying artifact app-linux-amd64: PASSED

PASSED: SLSA verification passed
```

Cualquier cambio en el binario o en el proceso de compilación resultará en un
fallo de verificación. Por ejemplo, intentemos adulterar el binario con el
comando:

```bash
$ echo "1" >> app-linux-amd64
```

Hecho esto, intentemos volverlo a comprobar con el mismo comando de arriba:

```bash
Verifying artifact app-linux-amd64: FAILED: expected hash '1bced40036f1f429d3fa76ffc7e744e661265ddff0557d4d2ce95a1a1da56aad' not found: artifact hash does not match provenance subject

FAILED: SLSA verification failed: expected hash '1bced40036f1f429d3fa76ffc7e744e661265ddff0557d4d2ce95a1a1da56aad' not found: artifact hash does not match provenance subject
```

Si cambia **un solo bit** podemos asumir que el artefacto (cual sea) ha sido
adulterado y por lo tanto **NO ES DE CONFIANZA**, da igual que se trate de un
error, un desliz humano o un bug del constructor. Es mejor asumir que ese
artefacto contiene el 0-day más peligroso del planeta y desecharlo como residuo
biológico-infeccioso...bueno no es para tanto, pero no es incorrecto asumir que
ese artefacto sea inseguro o incorrecto en el mejor de los casos.

## Usos y Beneficios más allá del ejemplo

La implementación de SLSA va más allá del _compliance_ genérico:

- **Alineación con Estándares (Ej.
  [NIST 800-218](https://csrc.nist.gov/pubs/sp/800/218/final) &
  [ISO/IEC 27001 A.15](https://www.dataguard.com/blog/iso-27001-annex-a.15-supplier-relationships/))**:
  Proporciona la evidencia auditable que agencias y clientes exigen cada vez más
  para la seguridad de la cadena de suministro (Supply Chain Security).

- **Mitigación de la Amenaza Interna (Insider Threat)**: Al requerir que la
  procedencia sea generada por el builder delegado y no por una GPG de un
  desarrollador en específico, se elimina la posibilidad de que un individuo
  suba una compilación maliciosa desde su máquina local. Esto mitiga (pero no
  elimina totalmente) el riesgo de que algún empleado/contribuidor le de por
  volverse malvado y se lleve de corbata toda la cadena de suministro en
  sistemas de producción críticos.

- **Integridad en Integración Continua**: Solo se permite que el sistema de
  CI/CD (GitHub Actions/GitLab Workflows/Woodpecker) sea el único que pueda
  certificar y firmar un artefacto de producción.

- **Despliegue Condicional**: En entornos de producción (Kubernetes, por
  ejemplo), puedes configurar políticas (usando
  [Gatekeeper](https://github.com/open-policy-agent/gatekeeper) o
  [Kyverno](https://kyverno.io/blog/2023/02/01/kyverno-and-slsa-3/)) que
  rechacen cualquier imagen Docker que no contenga una atestación SLSA
  verificable para ese repositorio.

- **Confianza en proyectos de Código Libre**: Todo lo anterior puede ser
  aplicado a organizaciones sin ánimo de lucro u organizaciones de
  desarrolladores en el internet para llevar un control comunitario que inspire
  confianza en los usuarios, si bien la confianza empresarial es importante para
  que un proyecto crezca y (¿por qué no?) reciba fondos para vivir. También
  puede ser un atractivo para los usuarios recibir software de confianza y que
  puedan verificar. No más descargas de Softonic. (Si, la pedrada va para uds,
  usuarios de windows, los estamos viendo) 😆.

## El presente de la confianza es verificable, por ahora.

A estas alturas el software moderno es un espagueti horrible, una composición
blasfema de dependencias y procesos de construcción completos para que podamos
disfrutar de nuestro software preferido. Si eres desarrollador web frontend
podría ser noticia (o no) saber que, si en tu stack está `vite` es 100% seguro
que usas `go`, pues `esbuild` está escrito en dicho lenguaje. Java no es el
único _write once, run anywhere_. Este nivel de confianza en el software que
usamos a diario, sea por ocio o por trabajo es importante que se mantenga y se
busquen formas de garantizar o tratar de garantizar la fiabilidad de lo que
entregamos a nuestros usuarios. Al implementar SLSA podemos transformar nuestra
cadena de suministro de software de _un acto de buena fe_ a _un acto de buena fe
con una prueba criptográfica verificable_ 😆.

De nuevo, no puedo hacer suficiente énfasis en esto. SLSA no es una vacuna o una
panacea que te garantize que **jamás** vas a caer presa de software adulterado.
En la seguridad informática muchas cosas no son cuestión de _"if it happens"_ es
una cuestión de _"when it happens"_. El verdadero valor de esto no está en la
generación del archivo de procedencia sino en la aplicación estricta de
`slsa-verifier` y en la disciplina que tengas, sea a nivel personal o en tu
equipo de trabajo. Más aún si eres mantenedor de uno o más proyectos de código
libre, es una responsabilidad que pocos aceptan porque en algunos casos, el
mundo depende del trabajo de sus manos. SLSA no es otra cosa más que la
respuesta industrial a la pregunta que por años nos hemos hecho en la
computación:

> _"¿Puedo confiar en este binario?"_

Al obligar a todo tu ecosistema a operar bajo la especificación de reglas de
SLSA y la atestación _in-toto_ firmada por una autoridad delegada como puede ser
GitHub a través de OIDC, logramos "elevar" nuestra postura de seguridad y
sentamos bases para que nuestros desarrollos, ideas y entornos productivos se
basen en **evidencia** criptográfica.

## Soft & Wet: Go Beyond!

Si has implementado SLSA para tu primer artefacto, ¡felicidades! Estás un paso
adelante en la seguridad de tu cadena de suministro de software. Sin embargo,
este es solo el comienzo.

Los siguientes pasos se centran en la automatización de la verificación y la
integración de sistemas de construcción avanzados, podrías pensarlo como _Beyond
Linux from Scratch_ (?) tal vez algo como _Beyond SLSA Attestations_.

Es una lista _opinionada_ por lo que, sugeriría que tomes los siguientes pasos
con _un granito de sal_ e investigues más por tu propia cuenta acerca de SLSA y
te animes a crear pruebas de procedencia en tus repositorios. Recuerda que un
artefacto puede ser un archivo cualquiera, en [JSR](https://jsr.io) los
artefactos son los archivos autogenerados de JavaScript/TypeScript que los
usuarios usarán como bibliotecas. En este blog todos los estáticos tienen sus
pruebas de procedencia, te invito que los pruebes 😉

El siguiente paso más valioso es asegurarse de que nadie pueda desplegar un
artefacto sin pasar primero por el verificador.

- **Integración en Gateways**: Utiliza herramientas de políticas de runtime como
  Kyverno o Open Policy Agent (OPA) Gatekeeper en tus clústers de Kubernetes.
  Estas herramientas pueden configurarse para:

  - Descargar automáticamente la atestación SLSA de una imagen.

  - Ejecutar el binario de `slsa-verifier` internamente.

  - Rechazar el despliegue si la atestación falla, si el nivel SLSA es bajo (ej.
    < 3), o si el repositorio fuente no coincide con la lista blanca.

- **Integración en Registros**: Configura tu CD para que solo consuma artefactos
  de registros que demuestren que la atestación está presente y es válida.

Si todo el embrollo de Kubernetes te resulta complejo, no estás limitado a
opciones empresariales. Si tienes un servidor en casa o como hobby, puedes darle
cuerda al hamster y combinar el binario de `slsa-verifier` con un script de bash
y usarlo para descargar/levantar un entorno con `podman compose` o administrar
los despliegues de tus servidores con playbooks de `ansible`.

Mucho mejor si puedes usarlo en tus pipelines de GitHub Actions para desplegar
tus programas si tienes tus propios runners.

Para usuarios que utilizan gestores de paquetes y sistemas de construcción
puramente funcionales como Nix o Guix, SLSA presenta una oportunidad única,
aunque con algunas matices a tener en cuenta.

Los sistemas declarativos ya proporcionan una fuerte garantía de inmutabilidad y
reproducibilidad, que son metas de SLSA. No obstante, SLSA complementa esto de
la siguiente manera:

- **Autenticación del Binario**: Aunque Nix/Guix garantizan que el código fuente
  produce el mismo hash de artefacto (reproducibilidad), SLSA certifica que ese
  artefacto fue realmente producido por un builder confiable y firmado por el
  dueño del proyecto. Esto protege contra actores maliciosos que podrían
  inyectar un código malicioso en el canal de la caché binaria. Para este
  escenario GNU Guix cuenta con el comando
  [`guix challenge`](https://guix.gnu.org/manual/devel/en/html_node/Invoking-guix-challenge.html),
  el cual te recomiendo leas a detalle, pues es un excelente aliado si deseas
  crear tu propio canal de GUIX o distribuir sustitutos en tus servidores.

- **Atestación del Entorno**: La especificación SLSA L4 requiere una
  _"construcción totalmente reproducible"_. Si bien Nix y Guix están diseñados
  para esto, usar las herramientas de SLSA (como el estándar In-Toto) permite
  externalizar y estandarizar la prueba de esa reproducibilidad a cualquier
  consumidor, usando un formato universalmente aceptado. Un ejemplo de esto son
  las [Debian reproducible builds](https://wiki.debian.org/ReproducibleBuilds).
  Otra idea que se me ocurre pero, que, debido al tamaño y naturaleza de los
  archivos sería replicar la atestación para artefactos como un `.iso` de
  instalación de GNU/Linux. ¿Cómo? Con la herramienta
  [`guix system`](https://guix.gnu.org/manual/devel/en/html_node/Invoking-guix-system.html)
  podemos generar una imagen ISO-9660 para una instalación fresca de GNU/GUIX o
  una ISO con las modificaciones de nuestro sistema operativo.

No te limites a un solo repositorio o un solo lenguaje. Recuerda, SLSA no es
magia para todos los males, de nada te servirá seguir esas prácticas
religiosamente si no la combinas con otras disciplinas de desarrollos en tus
procesos de construcción de software, tampoco te va a volver invulnerable a
ataques o malware en general, solo es una forma segura y probada de distribuir
programas para reducir lo más que sea posible el riesgo de que, los/tus usuarios
reciban software adulterado. Por último, SLSA es mucho, muchísimo más complejo
de lo que yo pueda haber escrito en este artículo y te recomendaría que, si está
en tus manos, dediques algo de tiempo a leer la especificación que está
disponible en su [sitio oficial](https://slsa.dev/).

Espero esta información sea de utilidad para ti o, si conoces a alguien a quien
pueda interesarle te invito a que le compartas el enlace de este artículo. No
tenemos analytics ni formularios de correo para evitar el spam, te invito a
suscribirte por medio de RSS o JSON usando los enlaces en el `footer` de este
sitio.

¡Gracias por leer el blog de Urutaú Limited! 💜🦉
