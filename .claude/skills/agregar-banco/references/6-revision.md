# Fase 6 — Revisión de Codex en los PRs

Los dos repos tienen Codex reviewer: cada push dispara una ronda. En
Patagonia hubo ~15 rondas en el fetcher.

## Por cada observación

1. **¿Es real?** Trazá un camino concreto (HTML/texto plausible del sitio →
   dato publicado mal o promo borrada).
2. **Si es real y chico:** arreglalo, agregá un test offline, corré el test
   del fetcher y el DRY_RUN completo, y compará con el dump anterior (ids
   agregados/quitados, conteos). Commit, push, respondé el hilo con el commit
   y qué cambió, y resolvelo.
3. **Si es una decisión de producto** (ubicaciones, qué entra en el id,
   categorías por segmento, registro en `fetchers.txt`, guardar el HTML
   crudo): no lo cambies; respondé que queda para el dueño y dejá el hilo
   abierto (o resolvelo si el usuario ya decidió). Agrupá estas decisiones y
   preguntáselas al usuario juntas.
4. **Si no vale su código:** respondé con el razonamiento (p. ej. guardar
   el HTML completo multiplica el tamaño de la colección) y resolvé.

Siempre con el footer de Claude Code en las respuestas. Los hilos se leen con
`pull_request_read get_review_comments` (paginá con `after`: pasan de 100) y
se resuelven por id `PRRT_…`.

## Cuidado con las regresiones propias

Dos rondas encontraron errores que introdujo el arreglo anterior (links
relativos resueltos contra la raíz, "no acumulable" anulando Plan Sueldo).
Después de cada arreglo, preguntate qué texto real legítimo podría romper.

## Cuándo cortar

Cuando 2–3 rondas seguidas solo traen casos hipotéticos (el DRY_RUN no cambia
ningún id), decíselo al usuario y recomendá mergear; lo que venga después va
en PRs aparte. No mergees sin su confirmación.

## Notificaciones

Las notificaciones de la propia sesión (tus respuestas) vuelven como eventos:
ignoralas. La edición del resumen de Codex con `status: running` solo indica
que está revisando.
