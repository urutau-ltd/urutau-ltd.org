---
description: Crea un articulo nuevo con nyc
---

Crea un articulo nuevo a partir de: $ARGUMENTS

1. Verifica que estas dentro del guix shell (`make env`).
2. Ejecuta `./bin/nyc add post "$ARGUMENTS"`.
3. Lee el archivo generado y completa `description`, `tags`, `author` y `date`
   siguiendo `src/posts/_data.ts` y los articulos existentes.
4. No escribas el cuerpo: deja el esqueleto para que el autor lo redacte.
