# Contexto de guardado en Supabase para el funnel IULB4

Este documento describe como esta organizado hoy el guardado de leads del funnel IULB4, tomando como referencia el funnel actual `app/iul-v4/page.tsx` y la API `app/api/lead/route.ts`.

El objetivo es que otro agente de Codex pueda replicar la misma logica de datos en un funnel visualmente diferente, sin depender del diseno actual. El nuevo funnel puede cambiar completamente la UI, pero si recoge la misma data debe guardar el lead de la misma forma.

## Resumen del flujo actual

El funnel recoge respuestas del usuario y, al final, hace un `POST` a `/api/lead`.

El frontend no escribe directamente en Supabase. Siempre manda la data al backend interno de Next:

```txt
Funnel IULB4 -> POST /api/lead -> Supabase admin client -> tablas leads y lead_metadata
```

La API usa `SUPABASE_SERVICE_ROLE_KEY`, por eso el guardado debe quedarse del lado servidor. No se debe insertar desde el browser con el publishable key.

Actualmente el funnel tambien prepara contexto para un flujo de llamada:

- Habra una pagina de gracias normal para leads.
- Habra una pagina de gracias/call para pay-per-call.
- Habra un popup antes de mandar a llamada cuando el horario de pay-per-call este activo.
- Esas paginas y el popup pueden ir creciendo despues. Para este documento solo importa que el lead ya debe guardarse antes de mostrar popup o redirigir a gracias.

## Data que recoge el funnel

El funnel actual manda esta data minima dentro de `answers`:

```ts
{
  ageGroup: string,
  insuranceGoal: string,
  state: string,
  firstName: string,
  lastName: string,
  phoneNumber: string,
  email: string,
  locationText: string,
  zipCode: string
}
```

Significado de cada campo:

- `ageGroup`: rango de edad seleccionado por el usuario.
- `insuranceGoal`: objetivo/interes del usuario, por ejemplo seguro de vida, ahorro, retiro, etc.
- `state`: estado de EE.UU. en nombre completo desde el frontend, luego se normaliza a abreviatura de 2 letras en backend.
- `firstName`: nombre.
- `lastName`: apellido.
- `phoneNumber`: telefono de EE.UU.; el backend lo normaliza a 10 digitos.
- `email`: correo.
- `locationText`: texto de ubicacion usado como contexto, normalmente ciudad/estado o ubicacion resuelta.
- `zipCode`: ZIP de 5 digitos.

El funnel tiene logica para omitir la pregunta de ZIP cuando ya puede resolver ubicacion/estado automaticamente. Aunque la pregunta se omita visualmente, para guardar el lead igual se necesita terminar con:

- `state`
- `zipCode`
- `locationText`

Si falta alguno, el funnel intenta completarlo con `/api/location`, con backup desde estado/telefono, o con `/api/zip/[zip]`. Si despues de eso sigue faltando ubicacion, no debe guardar el lead todavia.

## Payload que manda el frontend a `/api/lead`

El frontend manda este cuerpo:

```ts
{
  page: "/iul-v4",
  answers: {
    ageGroup,
    insuranceGoal,
    state,
    firstName,
    lastName,
    phoneNumber,
    email,
    locationText,
    zipCode
  },
  meta: {
    deviceId,
    trustedFormCertUrl,
    salePath,
    adaccountName,
    leadUrl
  }
}
```

Detalles de `meta`:

- `deviceId`: identificador propio guardado en cookie/local del funnel. Se usa para detectar velocidad o muchos envios desde el mismo dispositivo.
- `trustedFormCertUrl`: certificado de TrustedForm tomado del hidden field configurado por `NEXT_PUBLIC_TRUSTEDFORM_FIELD`. Solo se acepta si viene de `https://cert.trustedform.com`.
- `salePath`: `"call"` cuando el flujo activo debe ir por pay-per-call, o `"lead"` cuando debe ir por gracias normal.
- `adaccountName`: se toma del query param `adaccount_name` cuando viene en la URL.
- `leadUrl`: URL completa desde donde se envio el lead (`window.location.href`).

El request tambien manda un header:

```txt
x-lead-token: token generado por /api/lead-token
```

Ese token debe coincidir con la cookie httpOnly `bf_lead_token`. Se usa para evitar envios falsos y para bloquear multiples inserts si el usuario da varios clicks o el navegador dispara varios submits seguidos.

## Validaciones y normalizaciones antes de guardar

La API `/api/lead` hace estas normalizaciones:

- `phoneNumber`: queda como 10 digitos de EE.UU. Si viene con `1` al inicio y son 11 digitos, quita el `1`.
- `state`: si viene como nombre completo, lo convierte a abreviatura (`Florida` -> `FL`). Si ya viene como 2 letras, lo pone en mayuscula.
- `zipCode`: deja solo digitos y maximo 5 caracteres.
- Strings generales: se les hace `trim`.
- Campos vacios: se eliminan de `answers` antes de armar el payload final.

Tambien calcula banderas de riesgo:

- Telefono con longitud invalida.
- Telefono que no cumple patron NANP de EE.UU.
- Patrones como `555`, secuencias, repetidos o demasiados ceros.
- Telefono repetido varias veces en una ventana de 6 horas.
- Muchos envios desde la misma IP en 30 minutos.
- Muchos envios desde el mismo device id en 30 minutos.

Estas banderas no bloquean necesariamente el guardado; se guardan en metadata para revision.

## Tabla `leads`

La tabla principal `leads` guarda la parte limpia y consultable del lead. Es la tabla que debe usarse para listar o vender leads.

Columnas usadas por el codigo actual:

| Columna | De donde sale | Formato esperado |
| --- | --- | --- |
| `lead_id` | Lo genera Supabase por default (`gen_random_uuid`) | UUID |
| `created_at` | Lo genera Supabase por default (`now()`) | timestamp |
| `funnel_id` | Sale de `page` sin slash inicial. Para `/iul-v4` queda `iul-v4` | texto |
| `age_group` | `answers.ageGroup` | texto |
| `insurance_goal` | `answers.insuranceGoal` | texto |
| `state` | `answers.state` normalizado | 2 letras en mayuscula, por ejemplo `FL` |
| `zip_code` | `answers.zipCode` normalizado | 5 digitos |
| `first_name` | `answers.firstName` | texto |
| `last_name` | `answers.lastName` | texto |
| `phone_number` | `answers.phoneNumber` normalizado | 10 digitos |
| `email` | `answers.email` | email |
| `lead_status` | Depende de `meta.salePath` | `pending_call` o `ready_for_sell` |
| `trustedform_cert_url` | `meta.trustedFormCertUrl` | URL de TrustedForm o null |
| `language` | `NEXT_PUBLIC_LEAD_LANGUAGE` | `en`, `es` o null |
| `source` | `NEXT_PUBLIC_LEAD_SOURCE` | `network`, `internal` o null |
| `domain` | `NEXT_PUBLIC_LEAD_DOMAIN` | texto o null |

Regla de `lead_status`:

- Si `salePath === "call"`, se guarda `lead_status = "pending_call"`.
- Si `salePath === "lead"`, se guarda `lead_status = "ready_for_sell"`.

La API inserta primero en `leads` y pide de vuelta el `lead_id`:

```ts
insert({
  funnel_id,
  age_group,
  insurance_goal,
  state,
  zip_code,
  first_name,
  last_name,
  phone_number,
  email,
  lead_status,
  trustedform_cert_url,
  language,
  source,
  domain
}).select("lead_id").single()
```

Ese `lead_id` es la llave que conecta todo lo demas.

## Tabla `lead_metadata`

La tabla `lead_metadata` guarda el contexto completo, auditoria y datos que no tienen que vivir como columnas principales en `leads`.

La relacion es 1 a 1 con `leads`:

```txt
lead_metadata.lead_id -> leads.lead_id
```

Columnas usadas por el codigo actual:

| Columna | De donde sale | Formato esperado |
| --- | --- | --- |
| `lead_id` | `lead_id` devuelto por el insert en `leads` | UUID |
| `application_id` | `buildApplicationNumber(lead_id)` | texto tipo numero de aplicacion |
| `source` | Valor fijo interno `better-life-next` | texto |
| `page` | `body.page`, por ejemplo `/iul-v4` | texto |
| `submitted_at` | Fecha/hora del submit en backend | timestamptz |
| `ip_address` | `ipAddress(request)` o `x-forwarded-for` | texto |
| `geolocation` | `geolocation(request)` de Vercel | jsonb |
| `device_id` | `meta.deviceId` o cookie `bf_iul_device_id` | texto o null |
| `adaccount_name` | `meta.adaccountName` o `answers.adaccount_name` | texto o null |
| `lead_url` | `meta.leadUrl` | texto o null |
| `validation` | Objeto calculado por la API | jsonb |
| `risk_flags` | Array de banderas calculadas | text[] |
| `payload` | Objeto completo armado por la API | jsonb |

Importante: `user_agent` no se guarda como columna directa. Se guarda dentro de `payload`.

El codigo actual espera que `lead_metadata` tenga tambien estas columnas aunque no esten en una referencia vieja del schema:

- `application_id`
- `lead_url`

Si una base nueva no tiene esas columnas, el insert de metadata va a fallar.

## Como se organiza `payload`

`payload` es el snapshot completo del lead en formato JSON. Es el lugar donde se conserva lo que no necesariamente debe tener una columna propia.

Estructura actual aproximada:

```ts
{
  submittedAt: string,
  source: "better-life-next",
  pagina: "/iul-v4",
  funnelId: "iul-v4",
  language: "es" | "en" | null,
  leadSource: "network" | "internal" | null,
  domain: string | null,
  ipAddress: string,
  geolocation: object,
  trustedFormCertUrl: string,
  adaccountName: string,
  leadUrl: string,
  userAgent: string,
  user_agent: string,
  salePath: "lead" | "call",
  leadStatus: "ready_for_sell" | "pending_call",

  ageGroup: string,
  insuranceGoal: string,
  state: "FL",
  firstName: string,
  lastName: string,
  email: string,
  locationText: string,
  zipCode: string,
  phoneNumber: string,

  validation: {
    phoneCountry: "US",
    duplicatePhoneCount: number,
    ipVelocityCount: number,
    deviceVelocityCount: number,
    flags: string[]
  }
}
```

Notas:

- `payload.state` queda como abreviatura de 2 letras.
- `payload.zipCode` queda con 5 digitos.
- `payload.phoneNumber` queda con 10 digitos.
- `payload.user_agent` y `payload.userAgent` contienen el user agent del request.
- `payload.source` es el source tecnico interno del app (`better-life-next`), no el mismo valor que `leads.source`.
- `payload.leadSource` viene de `NEXT_PUBLIC_LEAD_SOURCE` y normalmente indica si el lead es `network` o `internal`.

## Variables de entorno y configuracion necesarias

### Supabase

Estas son necesarias para que el backend pueda guardar:

| Variable | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase. La usa el cliente admin y tambien el cliente publico si se necesita. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key para insertar desde API server-side. No debe exponerse en el frontend. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key. No se usa para el insert admin de `/api/lead`, pero puede existir para otros clientes publicos. |

### Nombres de tablas

Estas permiten cambiar el nombre fisico de las tablas sin cambiar codigo:

| Variable | Default si no existe | Uso |
| --- | --- | --- |
| `SUPABASE_LEADS_TABLE` | `leads` | Tabla principal de leads. |
| `SUPABASE_LEAD_METADATA_TABLE` | `lead_metadata` | Tabla de metadata del lead. |

### Clasificacion del lead

Estas se guardan en columnas de `leads` y tambien en `payload`:

| Variable | Valores esperados | Donde se guarda |
| --- | --- | --- |
| `NEXT_PUBLIC_LEAD_LANGUAGE` | `en` o `es` | `leads.language` y `payload.language` |
| `NEXT_PUBLIC_LEAD_SOURCE` | `network` o `internal` | `leads.source` y `payload.leadSource` |
| `NEXT_PUBLIC_LEAD_DOMAIN` | dominio o identificador libre | `leads.domain` y `payload.domain` |

Si `NEXT_PUBLIC_LEAD_LANGUAGE` no es `en` o `es`, se guarda `null`.

Si `NEXT_PUBLIC_LEAD_SOURCE` no es `network` o `internal`, se guarda `null`.

`NEXT_PUBLIC_LEAD_DOMAIN` solo se limpia con `trim`; si existe, se guarda.

### TrustedForm

| Variable | Uso |
| --- | --- |
| `NEXT_PUBLIC_TRUSTEDFORM_FIELD` | Nombre del hidden field donde TrustedForm deja el certificado. Default actual: `xxTrustedFormCertUrl`. |
| `TRUSTEDFORM_API_KEY` | API key server-side para reclamar el certificado. |
| `TRUSTEDFORM_VENDOR` | Nombre de vendor que se manda al claim. Default: `Better Life`. |

El certificado se guarda primero en:

- `leads.trustedform_cert_url`
- `payload.trustedFormCertUrl`

Despues, si hay certificado valido, la API intenta reclamarlo en segundo plano y actualiza `lead_metadata`:

- `trustedform_claim_status`
- `trustedform_claimed_at`
- `trustedform_claim_response`
- `trustedform_claim_error`

### Pay-per-call y Ringba

El funnel lee configuracion runtime desde `/api/runtime-config`. Esa API busca variables en la tabla `environment_variables`, no directamente en `process.env`.

Variables que busca en `environment_variables`:

| Variable | Uso |
| --- | --- |
| `NEXT_PUBLIC_PAY_PER_CALL_STATUS` | Debe ser `ON` para activar call flow. |
| `NEXT_PUBLIC_PAY_PER_CALL_START_TIME` | Hora inicio, formato `HH:mm`. |
| `NEXT_PUBLIC_PAY_PER_CALL_END_TIME` | Hora fin, formato `HH:mm`. |
| `NEXT_PUBLIC_RINGBA_CAMPAIGN_ID` | Campaign ID de Ringba, formato tipo `CA...`. |
| `NEXT_PUBLIC_PAY_PER_CALL_PHONE_NUMBER` | Numero base pay-per-call. |

Si la configuracion esta completa y el horario esta activo, el frontend manda:

```ts
meta.salePath = "call"
```

Eso hace que el lead se guarde con:

```txt
leads.lead_status = pending_call
```

Si no esta activo, manda:

```ts
meta.salePath = "lead"
```

Y se guarda:

```txt
leads.lead_status = ready_for_sell
```

## Tabla `ringba_call_events`

Esta tabla no se llena durante el insert principal del lead. Se usa despues, en el flujo de llamada o webhooks de Ringba.

Casos actuales:

- `/api/call-attribution` puede guardar o actualizar el numero mostrado al usuario.
- La funcion Supabase `ringba-conversion` puede guardar eventos webhook de Ringba y marcar un lead como vendido si detecta conversion real.

Columnas esperadas por el flujo de call attribution:

| Columna | Uso |
| --- | --- |
| `lead_id` | UUID del lead. |
| `funnel_id` | Actualmente `iul-v4`. |
| `event_name` | Por ejemplo `printed_number_captured`. |
| `conversion_status` | Por ejemplo `captured`. |
| `printed_number` | Numero que vio el usuario en la pagina/popup. |
| `raw_payload` | JSON con el detalle del evento. |

Si se usa Ringba completo, tambien se usan columnas como:

- `ringba_call_id`
- `call_duration_seconds`
- `caller_phone_number`
- `dialed_phone_number`
- `payout`
- `revenue`

La tabla `ringba_call_events` es complementaria. El lead principal siempre debe existir primero en `leads`.

## Seguridad contra multiples guardados

El funnel actual tiene dos protecciones:

1. En frontend, `submitInFlightRef` bloquea clicks repetidos antes de que React alcance a re-renderizar el boton como disabled.
2. En backend, el `lead-token` se reserva por unos minutos. Si entran dos requests casi simultaneos con el mismo token, solo el primero puede insertar; el segundo recibe `409`.

El token se obtiene llamando a `/api/lead-token`. Esa ruta devuelve `{ token }` y tambien setea una cookie httpOnly llamada `bf_lead_token`.

Para guardar un lead, `/api/lead` exige:

- Origin permitido.
- Header `x-lead-token`.
- Cookie `bf_lead_token`.
- Que header y cookie coincidan.
- Que ese token no haya sido consumido por otro request concurrente.

Al final de un guardado exitoso, la API borra la cookie `bf_lead_token`.

## Query params despues de guardar

Despues de guardar, el frontend arma parametros para popup o paginas de gracias:

```txt
funnel_id=iul-v4
lead_id=<uuid>
first_name=<nombre>
insurance_goal=<objetivo>
application_number=<buildApplicationNumber(lead_id)>
ppc_phone=<numero pay-per-call, si existe>
ringba_campaign_id=<campaign id, si existe>
```

Esto no cambia el insert principal, pero es importante para que el popup y las paginas de gracias puedan mostrar o atribuir correctamente el lead.

## Resultado esperado de `/api/lead`

Si el guardado sale bien, la API responde:

```ts
{
  ok: true,
  saved: true,
  leadId: string | null
}
```

El frontend usa `leadId` para:

- Construir `application_number`.
- Mandar eventos GTM con `lead_id` y `external_id`.
- Abrir popup de call si aplica.
- Redirigir a pagina de gracias normal si no aplica call.

## Esquema minimo recomendado

Para replicar el guardado actual, la base debe tener al menos:

### `leads`

```sql
lead_id uuid primary key default gen_random_uuid(),
created_at timestamptz default now(),
funnel_id text not null,
age_group text,
insurance_goal text,
state text,
zip_code text,
first_name text,
last_name text,
phone_number text,
email text,
lead_status text not null default 'ready_for_sell',
trustedform_cert_url text,
sold_as text,
language text,
source text,
domain text
```

### `lead_metadata`

```sql
lead_id uuid primary key references leads(lead_id) on delete cascade,
created_at timestamptz default now(),
source text,
page text,
submitted_at timestamptz,
ip_address text,
geolocation jsonb,
device_id text,
adaccount_name text,
application_id text,
lead_url text,
validation jsonb,
risk_flags text[],
payload jsonb,
lead_status_history jsonb default '[]'::jsonb,
trustedform_claim_status text,
trustedform_claimed_at timestamptz,
trustedform_claim_response jsonb,
trustedform_claim_error text
```

### `ringba_call_events`

```sql
id uuid primary key default gen_random_uuid(),
created_at timestamptz default now(),
lead_id uuid references leads(lead_id) on delete set null,
funnel_id text,
ringba_call_id text,
event_name text,
conversion_status text,
call_duration_seconds integer,
caller_phone_number text,
dialed_phone_number text,
printed_number text,
payout numeric,
revenue numeric,
raw_payload jsonb not null
```

### `environment_variables`

Debe existir si el funnel va a leer configuracion runtime de pay-per-call:

```sql
variable_name text,
variable_value text
```

La API actual lee de ahi las variables `NEXT_PUBLIC_PAY_PER_CALL_*` y `NEXT_PUBLIC_RINGBA_CAMPAIGN_ID`.

## Puntos importantes para el nuevo funnel

- El estilo visual puede cambiar totalmente; el contrato de datos debe mantenerse.
- Si se recoge la misma data, el `answers` debe tener los mismos nombres de campos.
- La pregunta de ZIP puede omitirse visualmente, pero el submit final debe tener `state`, `zipCode` y `locationText`.
- El lead siempre se guarda antes de popup o gracias.
- `leads` guarda la data limpia y operativa.
- `lead_metadata.payload` guarda el snapshot completo.
- `user_agent` va dentro de `payload`, no como columna directa.
- `lead_metadata` tambien recibe datos de auditoria como IP, geolocation, device id, validation y risk flags.
- El flujo de call/Ringba se conecta por `lead_id`, pero puede implementarse progresivamente.
