# Dockerfile for experimental Deno bundling capabilities
#
# Since Deno is not available on GNU Guix this Containerfile is used as an
# experimental bundling & minify test to ship even smaller source code to the
# client's browser using the under-the-hood ESBuild integration.
#
# === BUILD STAGE ===
FROM docker.io/denoland/deno:alpine-2.5.6

WORKDIR srv/

COPY . .

RUN apk add make --no-cache && deno install --allow-scripts

ENV TERM=xterm-256color
ENV DENO_NO_UPDATE_CHECK=disable

LABEL org.opencontainers.image.authors="Urutaú Limited"
LABEL org.opencontainers.image.title="urutau-ltd.org"
LABEL org.opencontainers.miage.licenses="AGPL-v3.0+"
LABEL org.opencontainers.image.url=https://sl.urutau-ltd.org/urutau-ltd.org/
LABEL org.opencontainers.image.source=https://sl.urutau-ltd.org/urutau-ltd.org/
LABEL org.opencontainers.image.description="Static site builder image"
LABEL org.opencontainers.image.vendor="Urutaú Limited."
LABEL org.opencontainers.image.version="v1.0.0-first-light"

CMD ["make", "build"]
