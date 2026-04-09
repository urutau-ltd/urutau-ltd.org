---
title: Contacto
layout: layout.tsx
type: page
---

# Contacto 📧

Necesitarás poder ver en la oscuridad para contactarnos. El correo no se publica
como texto plano ni como un desafío reversible de una sola pieza.

> Esto lo hacemos para evitar el spam de crawlers genéricos y bots que no sean
> capaces de reconstruir fragmentos locales o de ejecutar pequeños scripts.

<div class="box" data-contact-root data-contact-length="17">
    <p>
        El correo se ensambla localmente en tu navegador solo cuando lo pides.
        No se realiza ninguna petición adicional para revelarlo.
    </p>
    <p>
        <b>Fragmentos públicos</b>:
        concatena en el orden <code>2 → 4 → 1 → 3</code>.
    </p>
    <p class="flex-row flex-wrap:wrap">
        <chip class="info"><code data-contact-part>VGBHnxkt</code></chip>
        <chip class="info"><code data-contact-part>FGZYapDt</code></chip>
        <chip class="info"><code data-contact-part>C8I8XDZh</code></chip>
        <chip class="info"><code data-contact-part>s5Wt0Do</code></chip>
    </p>
    <p data-contact-status aria-live="polite">
        Pulsa el botón para reconstruir el correo aquí mismo.
    </p>
    <p>
        <button type="button" data-contact-action="reveal">
            Revelar correo
        </button>
    </p>
    <p hidden data-contact-output-wrap>
        <a data-contact-output></a>
    </p>
</div>

## Sin JavaScript

Si prefieres no ejecutar JavaScript, puedes reconstruir el desafío de forma
manual con el prefijo `u2.17.` y los fragmentos en el orden indicado, luego
ejecutar:

```bash
./genmail.pl --decode --challenge 'u2.17.<frag-2>.<frag-4>.<frag-1>.<frag-3>'
```
