# CuentasDeRetiro.com

Sitio público en Next.js 16 para `https://cuentasderetiro.com`, preparado para
desplegarse en Vercel.

## Desarrollo

```bash
npm install
npm run dev
```

## Verificación del dominio en Meta

1. En Meta Business Manager, elige la verificación mediante meta tag.
2. Copia únicamente el valor de `content`.
3. Crea `META_DOMAIN_VERIFICATION` en Vercel para Production.
4. Despliega de nuevo y solicita la verificación.

El token se renderiza como:

```html
<meta name="facebook-domain-verification" content="TOKEN" />
```

## Rutas públicas

- `/`: landing pública.
- `/privacidad`: política de privacidad.
- `/terminos`: términos y divulgaciones.
- `/robots.txt`: acceso para crawlers, incluidos `facebookexternalhit` y `Facebot`.
- `/sitemap.xml`: páginas indexables.
- `/opengraph-image`: imagen social generada por Next.js.
- `/meta.json`: manifiesto informativo propio; no es un requisito oficial de Meta.

## Antes de captar leads

La versión actual no recopila ni transmite datos. Antes de añadir un formulario
o Meta Pixel hay que definir el receptor de leads, consentimiento de contacto,
campos mínimos, política de retención, mecanismo de exclusión y configuración
de cookies aplicable. Nunca se deben enviar a Meta contraseñas, credenciales,
datos bancarios, números completos de Seguro Social ni campos de texto libre
que puedan contener información financiera sensible.
