# Fase 7 — Lanzamiento a producción

Merge **no** es deploy: el código corre en un servidor con pm2 que hay que
actualizar. Y el orden importa porque el backend no reprocesa ids.

## 1. 🛑 Filas de referencia en Mongo (antes que nada)

Esta sesión no tiene credenciales de Mongo; no las pidas. Opciones:

- **Sesión local (recomendada):** el usuario abre en su máquina, en la
  carpeta de `benefits-backend-v2` con el `.env` de producción,
  `claude remote-control`. Encontrala con `list_sessions` (entorno
  `bridge`) y mandale con `send_message` instrucciones autocontenidas:
  ubicar el clone con `.env`, `git fetch && git checkout
  claude/<banco>-onboarding`, correr `npm run seed-<banco>-references`
  **sin** `--apply`, mostrar la salida (la última línea debe decir
  `benefitsV3: N rows, M missing`) y aplicar con `-- --apply` solo si el
  usuario confirma. Nada de imprimir el `.env`.
- O que el usuario lo corra a mano.

Verificá después leyendo los eventos de esa sesión (`list_events`, buscá
`rows, … inserted` y `0 missing`).

## 2. 🛑 Corrida local de prueba (opcional, recomendada)

Misma sesión local: `fetcher-v1` en `main` (o la rama), `DRY_RUN=1 node
src/<Banco>/fetcher.js`, y que reporte productos, documentos y fallas. La
corrida real escribe en producción y la procesa el backend en la próxima
hora: solo con confirmación explícita y con el backend ya deployado.

## 3. 🛑 Merge

Con confirmación del usuario: primero el PR del backend, después el del
fetcher (commits de merge, como el resto de los PRs de esos repos). Después:
`unsubscribe_pr_activity` en ambos y borrar recordatorios programados.

## 4. 🛑 Deploy (lo hace el usuario en el servidor)

En las carpetas de `fetcher-v1` y `benefits-backend-v2` del servidor:
`git checkout main && git pull origin main`. Sin `npm install` salvo que
cambien dependencias, sin reinicio de pm2: `benefits-fetchers-hourly`
(en punto) y `process-all-banks-hourly` (a y cuarto) relanzan cada hora con
el código del disco. La API del backend (playground) corre aparte; solo hace
falta reiniciarla si cambió `server/api.ts`. Blink-v2 no se deploya salvo
que falte el logo (skill `add-bank-logo`) o colores.

Logs a mirar: `pm2 logs benefits-fetchers-hourly` (productos, documentos,
`Removed stale docs: 0` en la primera corrida) y
`pm2 logs process-all-banks-hourly` (`<BANCO>_PROMOS_RAW` procesado; la
primera vez es todo el volumen con IA, con su costo).

## 5. Verificación con la API pública

```bash
curl -s "https://www.blinkapp.com.ar/api/benefits?bank=<banco>&limit=200" \
  | python3 -c "import json,sys,collections;b=json.load(sys.stdin)['benefits'];print(len(b),collections.Counter(x['sourceCollection'] for x in b))"
curl -s "https://www.blinkapp.com.ar/api/banks" | python3 -c "import json,sys;print([b for b in json.load(sys.stdin)['banks'] if '<banco>' in b['key']])"
```

Tomá la foto **antes** del deploy (en Patagonia: 43 beneficios, todos de
`MODO_PROMOS_RAW`, y Patagonia ausente en `/api/banks`) y compará después:
tienen que aparecer beneficios con `sourceCollection: <BANCO>_PROMOS_RAW`.
Revisá en la app tier, suscripción y legales de algunos.

## Pendientes típicos para después

Ubicaciones de locales, qué entra en el id (título/categorías), categorías
por segmento, retiro de beneficios publicados cuando desaparece el crudo
(cambio de backend para todos los bancos).
