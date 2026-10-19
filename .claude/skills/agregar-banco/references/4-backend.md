# Fase 4 — Onboarding en blink-ar/benefits-backend-v2

Referencia: PR #88 (`bankConfigs/patagonia.json`,
`tests/patagoniaConfig.test.js`, `docs/new-bank-PATAGONIA_PROMOS_RAW.md`,
`scripts/seedPatagoniaReferences.ts`).

## 1. `bankConfigs/<banco>.json`

```json
{ "bank": "<BANCO>_PROMOS_RAW", "version": "1", "fieldRules": [ ... ],
  "createdAt": "...", "updatedAt": "..." }
```

Acciones de `fieldRules`:
- `strip`: campos de bookkeeping del scraper (`_id`, `fetchedAt`,
  `productId`, `sku`, `store`, `segmentKey`, `validityText`, `validFrom`,
  `contentHash`, `detailInfo`, booleanos auxiliares).
- `copy`: valores ya limpios → `id`, `merchant.name`, `validUntil` (ISO,
  `combine:false`), `termsAndConditions`.
- `transform` con `skipNull: true`: `discountPercentage` (`extractNumber`),
  `installments` (`extractWholeNumber`). Sin `skipNull`, un beneficio en
  cuotas queda con descuento null pre-poblado.
- `hint` (con `priority` opcional): `benefitTitle`, `description`,
  `categories`, `availableDays`, `caps`, `eligibilities[].cardTypes`
  (`cards` y `segment` si el segmento es tier), `eligibilities[].subscription`,
  `online`, `link`, `otherDiscounts` (2x1).

Gotchas:
- `normalize.hbs` **ignora hints booleanos**: el requisito tiene que ir como
  texto (`payrollRequirement`), no como `true/false`.
- `sanitizeBenefitEligibilities` deja **una** eligibility por banco y un
  slot de suscripción: si tier y requisito compiten, modelá el segmento como
  tier y el requisito como suscripción (decisión de la Fase 2).
- El filtro de "no empezado" del backend solo cubre MODO: el fetcher no debe
  emitir promos futuras.

## 2. Registro de la colección

`server/utils/mongoSurf.ts` → agregar `'<BANCO>_PROMOS_RAW'` a
`BANK_COLLECTIONS`. `processAllBanks` no tiene lista estática: toma la
colección desde la corrida del fetcher.

## 3. Test

`tests/<banco>Config.test.js` con 2 documentos crudos reales (uno con
descuento, otro en cuotas) usando `runBankPreprocessor` y `clearConfigCache`
de `bankPreprocessors/index.ts`: campos pre-poblados, campos stripeados,
hints (tier, suscripción, caps, días, categorías), cuotas sin descuento null.

```bash
node --import tsx --test tests/<banco>Config.test.js
```

La suite completa necesita Mongo: sin Mongo, las fallas son `ECONNREFUSED`
y `tests/merchantLocationResolution.test.js` se cuelga; corré solo el test
nuevo y comparalo contra `main`.

## 4. Doc de onboarding

Copiá `docs/new-bank-setup-checklist.md` a
`docs/new-bank-<BANCO>_PROMOS_RAW.md` y completalo: fuente, forma del crudo,
filas de referencia, notas (bugs del sitio, decisiones).

## 5. Filas de referencia + script

Formato que usa el backend (`services/referenceDataService.ts`,
`services/bankingService.ts`, `services/providerResolver.ts`), todo en
minúsculas salvo el nombre del proveedor:

- `providers`: `{ key: "<banco>", name: "<Nombre Banco>", bcra_code?, modo_bank_id? }`
  (puede existir ya si el banco aparecía vía MODO).
- `bank_cards`: `{ bank, issuer, tier, type }` por tier × producto, más
  `tier: "any"`.
- `bank_subscriptions`: `{ bank, name }`.

`bank` tiene que coincidir (sin mayúsculas) con el prefijo de la colección:
`PATAGONIA_PROMOS_RAW` → `patagonia`.

Copiá `scripts/seed-bank-references.template.ts` de la skill a
`scripts/seed<Banco>References.ts`, completá las constantes y agregá
`"seed-<banco>-references": "tsx scripts/seed<Banco>References.ts"` a
`package.json`. Es dry-run por defecto e idempotente. Probá que compile:

```bash
npx tsx -e "import('./scripts/seed<Banco>References.ts').then(m=>console.log(m.buildReferences()))"
```
