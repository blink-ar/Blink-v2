# Fase 3 — Fetcher en blink-ar/fetcher-v1

Referencia de implementación: `src/Patagonia/fetcher.js` y su test. Copiá su
estructura y adaptá el parseo a la fuente nueva.

## Contrato con el resto del repo

- Archivo `src/<Banco>/fetcher.js` que exporta `run()` y las funciones
  puras para testear; se ejecuta solo cuando es `require.main === module`.
- `createFetcherStatus({ bank, fetcherName })` de `src/fetcher-status.js`:
  `status.addMongoResult(...)`, `status.markDone(db)` al final,
  `status.markFailed(db, error)` en el catch. `markDone` es lo que hace que
  `processAllBanks` procese la colección: **nunca marques done una corrida
  incompleta**.
- Mongo: `MONGO_URL` del entorno; base `benefitsV3`; colección
  `<BANCO>_PROMOS_RAW`. Crear el `MongoClient` solo si no es DRY_RUN.
- `DRY_RUN=1`: hace todo menos conectar/escribir y devuelve los documentos.
- Límite opcional `<BANCO>_MAX_PRODUCTS` para pruebas (desactiva chequeos
  de cobertura y la limpieza).
- Registrar `<Banco>` en `fetchers.txt` (si el usuario lo aprobó).
- Test `src/<Banco>/fetcher.test.js`: chequeos offline con fixtures HTML
  mínimos + un fetch real chico. `node src/<Banco>/fetcher.test.js`.

## Forma del documento crudo

Un documento por **beneficio y segmento** (el backend guarda una sola
eligibility por banco). Campos usados en Patagonia:

`id`, `productId`, `url`, `title`, `merchantName`, `categories`, `segment`,
`segmentKey`, `discountPercentage`, `installments`, `offerText`, `capText`,
`capAmount`, `cards` (`{name, issuer, type}` normalizados: `visa|mastercard|amex`,
`credito|debito`), `wallets`, `daysText`, `days`, `validityText`,
`validFrom`, `validUntil` (ISO `YYYY-MM-DD`), `highlight`,
`payrollRequirement` (texto o null), `termsAndConditions` (ya acotado al
segmento), `detailInfo`, `contentHash`, `fetchedAt`.

**`id = <productId>-<segmentKey>-<contentHash>`**, con hash de todo lo que
se publica (oferta, tope, tarjetas ordenadas, billeteras, días, vigencia,
requisito, legales). Motivo: el backend saltea ids ya procesados; si la fuente
reutiliza el mismo producto para otra campaña con id fijo, el cambio nunca
llega a la app. Si la fuente tiene un id de promoción estable por campaña,
usalo directamente.

## Limpieza de documentos viejos

Tras un upsert exitoso de una corrida **completa** borrar los crudos que la
corrida ya no emitió (`deleteMany({ id: { $nin: idsActuales }, $nor: [...] })`).
Saltear la limpieza si: falló algún listado (aunque sea tolerado), hay límite
de productos, o es DRY_RUN. Proteger (vía `$nor` por `productId` +
`segmentKey`) los segmentos cuya página falló o que muestran una campaña
futura. `$nor` no puede ir vacío. La limpieza no retira lo ya publicado en
`confirmed_benefits`.

## Checklist de "fallar cerrado"

Todo esto salió de ~15 rondas de Codex en Patagonia. Cada punto evita
publicar datos incompletos sin aviso (y, con la limpieza, borrar promos
vigentes). Implementalo de entrada:

**Descubrimiento y paginación**
- Contar entradas del menú por separado y fallar si alguna no se parsea
  (comillas simples o dobles en `class`, links relativos resueltos contra la
  URL de la tienda, links fuera de la tienda cuentan como no parseados).
- Por tienda: fallar con 0 categorías, 0 productos o > 5 % de listados
  fallidos. Reportar los listados fallidos tolerados (para saltear limpieza).
- Paginación con total informado: exigir total si hay productos; conservar el
  total de páginas anteriores; fallar si cambia entre páginas, si los únicos
  superan el total, si una página repite productos o si termina por debajo.
- Página 1 vacía solo es válida con el mensaje de categoría vacía del sitio.
- Deduplicar por id dentro y entre páginas.
- Links de producto resueltos contra la URL del listado.

**Detalle**
- Validar que la página sea del producto pedido (id en la página).
- Validar que los segmentos del detalle correspondan a la tienda.
- Contar bloques de oferta y marcas de segmento por separado del splitter;
  aceptar ambas comillas.
- Porcentaje / cuotas: parsear sin depender del HTML exacto; si el texto
  visible tiene `%` o "cuota" sin valor parseado, rechazar el bloque.
- Medios de pago: toda `<img>` del bloque cuenta; `alt` vacío o desconocido
  = fallo. Normalizar alias (Visa Débito, MODO, etc.).
- Campos del encabezado por token de clase y contenido balanceado (divs
  anidados). Modal de legales completo (divs anidados).
- Tabla de información: contar filas, aceptar atributos en cualquier orden.
- Decodificar entidades HTML con nombre (`&eacute;`, `&ntilde;`, `&ordm;`…).
- Validar fechas reales (round-trip con `Date.UTC`), rechazar rangos
  invertidos. Formatos: `Del X al Y`, `desde X hasta Y`, un solo día;
  `desde X` / `a partir del X` / `hasta agotar stock` sin fin = fallo.
- Promos futuras: validarlas igual, no emitirlas, proteger las vigentes.

**Legales por segmento**
- Separar por títulos `Legales <Banco> <Segmento>`, `Legales <Segmento>` y
  líneas cortas `<Banco> <Segmento>`; texto previo = preámbulo común que se
  antepone. Si hay títulos con segmento, un segmento sin sección = fallo (no
  hereda los de otro). Esto encontró una fuga real en Patagonia (Adidas,
  "Legales Singular").

**Requisitos (plan sueldo, jubilados)**
- Buscar frases afirmativas ("exclusivo plan sueldo", "clientes que
  acreditan/acrediten el sueldo", "… o cobran la jubilación").
- Negación solo si apunta a la elegibilidad (`no acceden`, `no aplica`,
  `no participan`, `no (es) exclusivo`, `excepto`, `salvo`, `excluye`), en la
  misma cláusula o en el fragmento siguiente tras `,` `;` `:`. Un "no
  acumulable" no anula.

**Corrida**
- Fallar si > 5 % de detalles fallan, si no hay documentos, o si algún
  segmento esperado no tiene promociones parseadas.
- Requests solo al origen del banco (incluye redirecciones con puerto, vía
  `beforeRedirect` de axios).

## Entorno de la nube

axios 1.13 no funciona con el proxy del sandbox (405). Solo para correr en la
nube, sin cambiar el repo:

```bash
NODE_USE_ENV_PROXY=1 node --no-warnings -r <skill>/scripts/axios-noproxy.cjs src/<Banco>/fetcher.test.js
DRY_RUN=1 NODE_USE_ENV_PROXY=1 node --no-warnings -r <skill>/scripts/axios-noproxy.cjs -e \
  "require('./src/<Banco>/fetcher').run().then(d=>{require('fs').writeFileSync('<scratchpad>/docs.json',JSON.stringify(d,null,1));process.exit(0)})"
```

(`axios-noproxy.cjs` resuelve axios desde `/home/user/fetcher-v1`.)

Guardá el dump del DRY_RUN y comparalo después de cada cambio (ids
agregados/quitados, conteos por segmento, cantidad con requisito) para
demostrar que un arreglo no altera los datos vivos.
