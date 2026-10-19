---
name: agregar-banco
description: Integrar de punta a punta un banco o billetera nuevo a Blink (descubrir la fuente de beneficios, fetcher en blink-ar/fetcher-v1, onboarding en blink-ar/benefits-backend-v2, filas de referencia en Mongo, PRs, revisión de Codex, merge y verificación en producción). Usar cuando el usuario pida "agregá {banco} a Blink", "sumá el banco X", "integrá la billetera Y" o similar.
---

# Agregar un banco nuevo a Blink

Flujo completo, tal como se hizo con Banco Patagonia (fetcher-v1#8 y
benefits-backend-v2#88). Hacé todo vos salvo los **puntos de control**
marcados con 🛑, donde necesitás una respuesta o una acción del usuario.

Leé la guía de referencia de cada fase antes de empezarla:

| Fase | Guía |
| --- | --- |
| 1. Descubrir la fuente | `references/1-reconocimiento.md` |
| 3. Fetcher | `references/3-fetcher.md` |
| 4. Backend | `references/4-backend.md` |
| 6. Revisión de Codex | `references/6-revision.md` |
| 7. Lanzamiento | `references/7-lanzamiento.md` |

Scripts auxiliares en `scripts/`: cliente del MCP de REA, arreglo del proxy
para axios y plantilla del script de filas de referencia. En las guías,
`<skill>` es la carpeta de esta skill (donde está este `SKILL.md`); si la
skill vino adjunta o subida a la cuenta, ubicá esa carpeta y copiá `scripts/`
al scratchpad antes de usarlos.

## Arquitectura (para ubicarte)

```
sitio del banco ──► fetcher-v1 (pm2, cada hora, lee fetchers.txt)
                     └─► Mongo benefitsV3.<BANCO>_PROMOS_RAW (documentos crudos)
benefits-backend-v2 (pm2, cada hora :15, processAllBanks)
   bankConfigs/<banco>.json + IA ─► Mongo confirmed_benefits
Blink-v2 (Vercel) ─► lee confirmed_benefits; filtros/logo por clave de banco
```

- `processAllBanks` toma las colecciones de `FETCHER_RUN_STATUS`: si el
  fetcher corre y marca `done`, el backend procesa sin más registro.
- El backend **saltea ids ya procesados** y **no retira** beneficios
  publicados cuando desaparece el crudo (solo vencen por `validUntil`).
- Las tarjetas y suscripciones se resuelven contra `bank_cards`,
  `bank_subscriptions` y `providers`. Sin esas filas los beneficios se publican
  con tarjetas/suscripción "unresolved" (sin restricción) y no se corrigen
  después porque el id ya está procesado.

## Fase 0 — Preparación

1. Repos: la sesión suele arrancar en Blink-v2. Agregá
   `blink-ar/fetcher-v1` y `blink-ar/benefits-backend-v2` con `add_repo`
   (acceso `push`) y clonalos en `/home/user/`.
2. Ramas: `claude/<banco>-fetcher` (fetcher-v1) y
   `claude/<banco>-onboarding` (backend), desde `main`.
3. Red: si el entorno tiene red limitada y el dominio del banco no responde,
   pedile al usuario que cambie el acceso de red del entorno (leé
   `read_documentation` topic `environment.network` y pasale los pasos).
4. Si `rea` no está instalado: `npm install --global rea-agents`.

## Fase 1 — Descubrir la fuente

Seguí `references/1-reconocimiento.md`. Resultado esperado: sabés de dónde
salen los beneficios (API JSON pública, GraphQL, HTML server-side), cómo se
pagina, qué campos hay y cómo se representan segmentos, tarjetas, vigencia,
topes, días y legales. Bajá 2–3 ejemplos reales y guardalos en el scratchpad.

Si la fuente exige login, captcha o un token de sesión de usuario, o si el
sitio lo prohíbe expresamente, frená y avisale al usuario en lugar de
esquivarlo. Si no hay catálogo público, probá con el siguiente candidato que
proponga el usuario (con Fiwind y AstroPay pasó eso).

## Fase 2 — 🛑 Modelo de datos (preguntarle al usuario)

Antes de escribir código, mostrale al usuario 2–3 beneficios reales y
proponé cómo mapear:

- **Segmentos / niveles de cliente** (Clásica, Plus, Black, Joven…). En
  Patagonia se decidió: segmentos = `tier` de tarjeta.
- **Requisitos tipo suscripción** (plan sueldo, jubilados, paquete). En
  Patagonia: una sola suscripción "Plan Sueldo y Jubilación", porque el
  backend guarda **una** eligibility por banco y un solo slot de suscripción.
- Medios de pago (issuer/type de tarjeta, billeteras), tiers "any".

Hacé una sola pregunta con opciones concretas (AskUserQuestion) y seguí con
lo que conteste.

## Fase 3 — Fetcher (fetcher-v1)

Seguí `references/3-fetcher.md`. Resumen:

- `src/<Banco>/fetcher.js` + `src/<Banco>/fetcher.test.js`, siguiendo el
  patrón de los fetchers existentes (`src/Patagonia/fetcher.js` es la
  referencia más completa).
- Un documento crudo por beneficio y segmento; `id` estable que **cambie**
  cuando cambia el contenido de la promo.
- Escritura: `bulkWrite` con upsert por `id` en
  `benefitsV3.<BANCO>_PROMOS_RAW`; `DRY_RUN=1` no conecta a Mongo.
- Fallar cerrado ante cambios de formato (checklist en la guía), limpieza de
  documentos viejos solo tras una corrida completa y limpia.
- Registrar en `fetchers.txt` (preguntá en la Fase 2 si se registra ya o se
  deja para el lanzamiento; en Patagonia se registró).

Validación obligatoria antes del PR:
`node src/<Banco>/fetcher.test.js` y una corrida completa
`DRY_RUN=1 node src/<Banco>/fetcher.js` contra el sitio real, con conteos por
segmento, ids únicos y 0 páginas fallidas.

## Fase 4 — Backend (benefits-backend-v2)

Seguí `references/4-backend.md`:

- `bankConfigs/<banco>.json` (strip / copy / transform / hint).
- `<BANCO>_PROMOS_RAW` en `BANK_COLLECTIONS` (`server/utils/mongoSurf.ts`).
- `tests/<banco>Config.test.js` con documentos crudos reales.
- `docs/new-bank-<BANCO>_PROMOS_RAW.md` desde `docs/new-bank-setup-checklist.md`.
- `scripts/seed<Banco>References.ts` + script npm, desde
  `scripts/seed-bank-references.template.ts` de esta skill.

Correr `node --import tsx --test tests/<banco>Config.test.js`.

## Fase 5 — PRs

Abrí los dos PRs (backend y fetcher) con descripción completa: fuente, forma
del documento, comportamiento ante fallas, conteos del DRY_RUN y lo que
falta en datos. Referencialos entre sí. Suscribite a la actividad de ambos.

## Fase 6 — Revisión de Codex

Seguí `references/6-revision.md`. Arreglá lo real con test + DRY_RUN que
confirme que los datos vivos no cambiaron. Las decisiones de producto quedan
abiertas para el usuario. Cuando las rondas solo traen casos hipotéticos,
recomendá mergear.

## Fase 7 — Lanzamiento

Seguí `references/7-lanzamiento.md`. Orden obligatorio:

1. 🛑 Filas de referencia en Mongo **antes** de que el backend procese nada
   (esta sesión no tiene credenciales: se corre en la máquina del usuario con
   `claude remote-control`, o la corre el usuario).
2. 🛑 Confirmación del usuario → merge del backend y después del fetcher.
3. 🛑 El usuario hace `git pull` en el servidor (pm2) de ambas repos.
4. Verificación con la API pública de Blink.

## Reglas

- Nunca pidas, imprimas ni guardes credenciales.
- Nunca escribas en Mongo de producción desde la nube; corridas reales del
  fetcher o del seed solo con confirmación explícita del usuario.
- Mensajes al usuario en español rioplatense, directos.
- Commits con el footer de atribución que indique el sistema.
