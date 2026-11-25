# Blink: Search Console, 25 de noviembre de 2026

[Comparación web de siete días](https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain%3Ablinkapp.com.ar&num_of_days=7&compare_date=PREV): 21 vs. 24 clics; 2.050 vs. 1.120 impresiones; CTR 1,0% vs. 2,1%; posición media 12,8 vs. 12,1.

El crecimiento viene de las fichas de comercios, no de una sola landing: entre las 955 URLs que devuelve la tabla, `/comercios/` ganó 806 impresiones (1.011 → 1.817) y perdió siete clics (19 → 12). `/descuentos/` ganó 76 impresiones (67 → 143) y dos clics (2 → 4). Los agregados por URL y por propiedad no tienen necesariamente el mismo denominador. Las consultas visibles tampoco abarcan todas las impresiones.

| Página | Impresiones actual / anterior | Posición actual | Clics actual / anterior | Lectura |
|---|---:|---:|---:|---|
| Galicia / Gastronomía / CABA | 49 / 15 | 8,5 | 0 / 1 | La página ya tiene contenido y enlaces a comercios. Mantener como referencia para landing transaccional; la muestra no justifica cambiar el título. |
| Dental Total Bella Vista | 31 / 5 | 9,9 | 0 / 0 | Sin promoción vigente; 27 impresiones vienen de una consulta visible por el nombre exacto. Ofrecer una salida útil sin sugerir que hay una oferta. |
| Supermercados Vea | 26 / 0 | 18,0 | 0 / 0 | Tiene beneficios activos. Priorizar visibilidad desde categoría y enlaces pertinentes antes de juzgar el CTR. |
| Citrojunior | 20 / 3 | 10,9 | 0 / 0 | Otra ficha en el borde de la primera página; observar tráfico y vigencia antes de cambiar el snippet. |

Las URLs cuya posición media **actual** es 6–10 sumaron 798 impresiones netas; las de posición 11–20, 319. Son grupos por posición actual, no una medición de migración de rankings. No explica por sí solo por qué cayó el CTR.

El primer cambio deja intactos la home, títulos y canonicals. Cuando una ficha no tiene beneficios vigentes, el HTML inicial y la vista interactiva lo dicen explícitamente y enlazan a la categoría canónica cuando hay una útil, o al buscador general. Conserva el historial. No agrega consultas a la base.

Después del despliegue: verificar primero el enlace y la descripción en una ficha sin promociones y la ausencia del bloque en una ficha activa. Comparar dos períodos de siete días completos en Search Console, separando `/comercios/` de `/descuentos/`. Mirar clics junto con impresiones/posición y no atribuir cambios al PR sin considerar el mix de URLs y los cambios de promociones.
