# Fase 1 — Descubrir la fuente de beneficios

Objetivo: encontrar el origen de datos más estable y completo, y entender su
estructura antes de escribir el fetcher.

## Orden de búsqueda

1. **Sitio público de beneficios** del banco (buscá "beneficios <banco>",
   "promociones <banco>"). Patagonia: `ahorrosybeneficios.bancopatagonia.com.ar`
   (tienda Magento 2).
2. **API JSON** que usa ese sitio (XHR/fetch). Es la mejor opción si existe y
   no requiere login.
3. **Plataformas conocidas**: Magento (`/graphql`, `/rest/V1/...`), Strapi,
   Contentful, WordPress (`/wp-json/`). Probá esos endpoints directamente.
4. **HTML server-side** si no hay API. Es lo que se usó en Patagonia
   (GraphQL deshabilitado, REST con auth, ninguna XHR con datos).
5. App móvil sin catálogo web: frená y avisale al usuario (Fiwind y AstroPay
   no tenían catálogo público).

## Captura con REA (MCP de reverse engineering)

REA (`rea-agents`, `https://github.com/morluto/rea`) expone herramientas
MCP como `capture_browser_scenario`, `inspect_web_network_capture` y
`analyze_web_bundle`. En la nube se maneja con el cliente stdio
`.claude/skills/agregar-banco/scripts/mcp-call.mjs` (desde la raíz de Blink-v2):

```bash
npm install --global rea-agents          # si falta
node .claude/skills/agregar-banco/scripts/mcp-call.mjs tools/list > tools.json
node .claude/skills/agregar-banco/scripts/mcp-call.mjs tools/call '{"name":"capture_browser_scenario","arguments":{...}}'
```

**El Chromium que lanza REA no usa el proxy del sandbox.** Workaround:
lanzar Chromium a mano con el proxy y usar `mode: "connect"`:

```bash
/opt/pw-browsers/chromium-*/chrome-linux/chrome --headless=new --no-sandbox \
  --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1 \
  --proxy-server="$HTTPS_PROXY" --user-data-dir=<scratchpad>/chrome-profile \
  --lang=es-AR about:blank &
curl -s -X PUT "http://127.0.0.1:9222/json/new?about:blank"   # anotá el id
```

Argumentos de captura que funcionaron:

```json
{"browser":{"mode":"connect","cdp_endpoint":"http://127.0.0.1:9222","target_id":"<id>"},
 "start_url":{"url":"https://<sitio>/<listado>"},
 "actions":[
   {"step_id":"settle","action":"wait_for_timeout","duration_ms":5000},
   {"step_id":"detail","action":"goto","destination":{"url":"https://<sitio>/<detalle>"},"wait_until":"load"},
   {"step_id":"settle2","action":"wait_for_timeout","duration_ms":4000}],
 "capture":{"after_each_step":["url"],"at_end":["url"],"events":["network","page-errors"],
   "network":{"request_body":true,"response_body":true,"header_values":false},
   "limits":{"max_network_body_bytes":400000}}}
```

Al terminar: `pkill -f "remote-debugging-port=9222"`. No uses
`pkill -f` con patrones que coincidan con tu propia shell.

Si REA no aporta (sitio sin XHR), `curl --cacert /root/.ccr/ca-bundle.crt`
sobre las páginas alcanza para analizar el HTML.

## Qué relevar (anotalo, lo vas a necesitar)

- Cómo se listan los beneficios: categorías, paginación (parámetros, total
  informado), tamaño de página, ids estables.
- Detalle de cada beneficio: comercio, descuento / cuotas / 2x1, tope, días,
  vigencia (formato de fecha, zona horaria), medios de pago (logos con
  `alt`, texto), legales (modal, secciones por segmento).
- **Segmentos**: ¿vistas o tiendas distintas, marcas dentro del detalle,
  legales por segmento? En Patagonia: tiendas Magento `ahorrosybeneficios`
  (Clásica/Plus/Singular), `on` (Patagonia ON) y tiendas por segmento que solo
  agregan categorías.
- Requisitos especiales (plan sueldo, jubilados, exclusivos web).
- Ubicaciones de locales (endpoint de store locator), aunque no se usen
  todavía.
- Inconsistencias del sitio: en Patagonia la tabla "Más información" muestra
  fechas un día antes que el encabezado (bug de zona horaria): se usa el
  encabezado.
- Volumen: cantidad de productos y páginas, para estimar pedidos por corrida.

Guardá 2–3 HTML/JSON reales en el scratchpad para tests offline.
