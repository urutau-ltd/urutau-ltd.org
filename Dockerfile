# Dockerfile for experimental Deno bundling capabilities
#
# Since Deno is not available on GNU Guix this Containerfile is used as an
# experimental bundling & minify test to ship even smaller source code to the
# client's browser using the under-the-hood ESBuild integration.
#
# === BUILD STAGE ===
FROM docker.io/denoland/deno:alpine-2.9.8 AS builder

WORKDIR /srv

ENV DENO_DIR=/deno-dir

COPY . .

RUN apk add make libstdc++ vips --no-cache && \
    deno install --allow-scripts && \
    deno task build && \
    deno cache serve.ts

FROM docker.io/denoland/deno:alpine-2.9.8

WORKDIR /srv

ENV DENO_DIR=/deno-dir
ENV URUTAU_PORT=8000

COPY --from=builder /srv/output ./output
COPY --from=builder /srv/serve.ts .
COPY --from=builder /srv/deno.json .
COPY --from=builder /deno-dir /deno-dir

RUN chown -R deno:deno /srv /deno-dir

USER deno

ENV TERM=xterm-256color
ENV DENO_NO_UPDATE_CHECK=disable

LABEL org.opencontainers.image.authors="Urutaú Limited"
LABEL org.opencontainers.image.title="urutau-ltd.org"
LABEL org.opencontainers.image.licenses="AGPL-v3.0+"
LABEL org.opencontainers.image.url=https://sl.urutau-ltd.org/urutau-ltd.org/
LABEL org.opencontainers.image.source=https://sl.urutau-ltd.org/urutau-ltd.org/
LABEL org.opencontainers.image.description="Main website docker image"
LABEL org.opencontainers.image.vendor="Urutaú Limited."
LABEL org.opencontainers.image.version="v1.5.2-first-light"

CMD ["deno", "task", "start"]
