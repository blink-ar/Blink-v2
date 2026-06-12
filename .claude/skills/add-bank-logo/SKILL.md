---
name: add-bank-logo
description: Agregar o actualizar el logo de un banco/billetera en la app (normaliza el PNG, lo registra en el manifest y conecta los filtros). Usar cuando el usuario pida sumar, cambiar o arreglar el logo de un banco, billetera o entidad de pago.
---

# Agregar un logo de banco/billetera

Los logos viven en `public/banks/*.png` (512x512, fondo transparente, contenido
centrado en 400x400) y se registran en `src/data/bankLogosManifest.ts`.
`BankLogo` (`src/components/BankLogos/BankLogo.tsx`) los resuelve por clave
normalizada (minúsculas, sin acentos ni espacios) y cae a iniciales si no hay
match.

## Paso 1 — Conseguir la imagen

Pedile al usuario el logo si no lo adjuntó. Ideal: PNG/SVG cuadrado con fondo
transparente, ≥256px. Si solo hay SVG, sharp lo rasteriza igual.

## Paso 2 — Correr el script

```bash
node scripts/add-bank-logo.mjs <imagen-o-url> --key <clave> --name "<Nombre Display>" [--alias <alias>]...
```

- `--key`: minúsculas y números, sin espacios. Debe coincidir con cómo se
  normaliza el nombre real del banco (ej: "Mercado Pago" → `mercadopago`).
- `--alias`: claves extra que apuntan al mismo archivo (ver paso 3).

El script normaliza la imagen (trim de bordes transparentes, contenido en
400x400 sobre lienzo 512x512 transparente), la guarda en `public/banks/` y
actualiza el manifest ordenado alfabéticamente.

## Paso 3 — Token de filtro (CRÍTICO para que el filtro funcione)

Si el banco debe aparecer en los filtros con etiqueta/orden propios, agregalo a
`KNOWN_BANKS` y `getKnownDescriptor` en `src/utils/banks.ts`.

**Regla del token**: el token viaja como query `bank=` a la API, y el backend
(`api/[...path].js` + `api/search/entities.js`) matchea por regex/igualdad
contra nombres normalizados CON espacios y tokens de palabra. Por eso el token
debe ser **una palabra que exista en el nombre indexado**:

- ✅ "Mercado Pago" → token `mercado` (el indexer guarda `mercado pago`,
  `mercado`, `pago`)
- ❌ `mercadopago` no matchea nada (no existe colapsado en el índice)

Si el token difiere de `--key`, pasá el token como `--alias` al script:
`BankFilterSheet` le pasa el *token* a `BankLogo`, así que necesita una entrada
propia en el manifest.

## Paso 4 — Colores

- `src/components/neo/BankFilterSheet.tsx` → `BANK_BRAND[token]`: colores del
  chip del filtro (`bg` pastel + `color` de marca).
- `src/utils/bankColors.ts` → acento para el fallback de iniciales (matchear
  por `includes` sobre el nombre normalizado).

## Paso 5 — Verificar

```bash
npx tsc --noEmit && npx eslint src/data/bankLogosManifest.ts src/utils/banks.ts
npx vitest --run src/utils src/components/__tests__
```

Comprobar el round-trip del descriptor (todas las variantes deben dar el mismo
token):

```bash
npx vite-node -e "import { toBankDescriptor } from '/ruta/al/repo/src/utils/banks'; console.log(toBankDescriptor('Nombre Display'))"
```
