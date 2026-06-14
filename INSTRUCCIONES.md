# CuentasDeRetiro.com

## Objetivo

Funnel mobile-first para captar leads provenientes principalmente de campañas
de Meta/Facebook. El dominio de producción será `cuentasderetiro.com` y el
despliegue se realizará en Vercel.

El producto debe:

- Cargar muy rápido en teléfonos móviles.
- Presentar una sola pregunta por pantalla.
- Guardar el avance del lead durante el funnel.
- Enviar el lead final a Supabase.
- Integrar Meta Pixel y, cuando se configure, Conversions API.
- Permitir llamadas mediante un número de pay-per-call.
- Mantener textos legales, consentimiento y divulgaciones visibles.

## Alcance actual

La primera fase es frontend. El backend de persistencia, validación final,
deduplicación de eventos y envío a integraciones se implementará después de
recibir credenciales y definir el esquema de Supabase.

Actualmente está construido el Step 1:

- Pregunta: objetivo principal para el retiro.
- Respuestas: proteger ahorros, crecer dinero o generar ingresos al retirarse.
- La selección se guarda temporalmente en `sessionStorage` bajo
  `retirement_goal`.
- Se emite el evento del navegador `funnel:step-complete` para conectar el
  siguiente paso y la analítica más adelante.
- Todavía no se transmite ni persiste información personal.

## Flujo de referencia

La referencia visual entregada muestra este patrón:

1. Cabecera con marca y llamada.
2. Propuesta de valor.
3. Pregunta de selección.
4. Preguntas binarias de calificación.
5. Formulario de datos personales.
6. Pantalla final orientada a llamada.

El contenido de seguros de la referencia no debe copiarse. Solo se reutiliza la
estructura de conversión, adaptada a retiro y con afirmaciones verificables.

## Arquitectura

- Next.js 16 App Router.
- React 19.
- TypeScript estricto.
- Tailwind CSS 4 disponible, aunque el funnel usa CSS global directo para
  minimizar abstracciones y reproducir el diseño con precisión.
- Server Components por defecto.
- Un Client Component pequeño en `app/funnel-step-one.tsx` contiene la única
  interacción actual.
- No se cargan fuentes, imágenes ni scripts externos en el primer render.
- Las ilustraciones e iconos son SVG inline para evitar solicitudes adicionales.

## Rutas

- `/`: funnel.
- `/privacidad`: política de privacidad.
- `/terminos`: términos de uso.
- `/robots.txt`: reglas para crawlers.
- `/sitemap.xml`: rutas indexables.
- `/meta.json`: manifiesto informativo del sitio.

## Integraciones previstas

### Supabase

El navegador no debe utilizar la `service role key`. Las escrituras de leads se
harán desde un Route Handler o Server Action con validación, rate limiting y una
capa de acceso a datos `server-only`.

Campos iniciales a definir:

- Identificador interno.
- Fecha de creación.
- Respuestas del funnel.
- Nombre, teléfono, email y código postal.
- Consentimientos y versión del texto legal.
- UTM, `fbclid`, `fbc`, `fbp` y landing URL.
- Estado del lead y resultado de entrega.

### Meta

- Meta Pixel se cargará solo cuando exista un ID válido y se haya definido el
  comportamiento de consentimiento.
- Conversions API debe usar el mismo `event_id` que Pixel para deduplicación.
- No se enviarán contraseñas, datos bancarios, números completos de Seguro
  Social ni texto libre que pueda contener información financiera sensible.

### Pay-per-call

El teléfono visible y el enlace `tel:` se configuran con variables de entorno.
Más adelante se conectará el proveedor de tracking y su webhook si aplica.

## Reglas de rendimiento

- Diseñar primero para anchos de 320 a 430 px.
- Mantener el contenido crítico en HTML prerenderizado.
- Evitar librerías de UI y analítica innecesarias.
- Cargar scripts de marketing después del contenido y según consentimiento.
- Reservar dimensiones de cualquier asset para evitar layout shift.
- Medir Lighthouse y Core Web Vitals antes de lanzar campañas.

## Variables de entorno

Los placeholders están en `.env.local` y `.env.example`. Los secretos nunca
deben usar el prefijo `NEXT_PUBLIC_`.

## Próximos pasos

1. Aprobar visualmente el Step 1.
2. Diseñar y conectar los demás steps.
3. Definir tabla y políticas RLS de Supabase.
4. Implementar persistencia y validación server-side.
5. Integrar consentimiento, Pixel, CAPI y pay-per-call.
6. Ejecutar pruebas de extremo a extremo y auditoría móvil.
