#!/usr/bin/env bash

# Reemplaza con tu correo
EMAIL=${GENMAIL_TARGET}

HEX_STRING=$(printf '%s' "$EMAIL" | od -An -tx1 | tr -d ' \n')
CHALLENGE=$(echo -n "$HEX_STRING" | rev | base64 | tr -d '\n')

echo "Desafío de Contacto: $CHALLENGE"

echo "Prueba de decoding:"
printf "$(echo -n "$CHALLENGE" | base64 -d | rev | sed 's/\([0-9a-fA-F][0-9a-fA-F]\)/\\x\1/g')\n" 
