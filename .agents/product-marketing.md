# Product Marketing Context

*Last updated: 2026-06-26*

## Product Overview
**One-liner:** Blink es un buscador argentino para encontrar y comparar promociones, descuentos, cuotas y beneficios antes de pagar.

**What it does:** Blink reúne beneficios de bancos, billeteras, clubes y suscripciones en comercios de Argentina. Permite buscar por comercio, banco, categoría, descuento mínimo, cuotas, día de vigencia, modalidad online o beneficios cercanos. En cada ficha muestra condiciones, topes, vigencia, sucursales y medios de pago cuando esos datos están disponibles.

**Product category:** Buscador de promociones, descuentos bancarios y beneficios de tarjetas en Argentina.

**Product type:** Producto consumer/B2C web app y PWA, con base mobile en React Native/Expo. También tiene potencial B2B futuro para catálogos de beneficios de entidades con afiliados.

**Business model:** Por validar. Hoy el producto parece priorizar adquisición orgánica/SEO, comunidad y recurrencia de usuarios. Hipótesis futura: afiliación, partnerships, inventario patrocinado o producto B2B para proveedores de beneficios.

## Target Audience
**Target companies:** Principalmente no aplica para el core actual, que es B2C. Para una línea B2B futura: colegios profesionales, consejos, cajas profesionales, clubes, mutuales, gremios chicos y asociaciones con beneficios para miembros.

**Decision-makers:** Para B2C, el usuario decide solo. Para B2B futuro: responsables de marketing, comunicación, beneficios, membresía o relación con afiliados.

**Primary use case:** Encontrar rápidamente qué descuento o beneficio conviene usar en un comercio, categoría o compra concreta antes de pagar.

**Jobs to be done:**
- Encontrar promociones vigentes por comercio, banco, billetera, tarjeta, día o categoría.
- Comparar topes, cuotas, condiciones y modalidad de uso para elegir la opción que más ahorra.
- Descubrir beneficios cercanos u online sin revisar muchas páginas de bancos por separado.
- Guardar comercios/beneficios relevantes y recibir avisos de oportunidades.

**Use cases:**
- "Voy a comprar en Frávega/Coto/PedidosYa/Farmacity y quiero saber con qué banco me conviene pagar."
- "Tengo Galicia/Santander/Macro/NaranjaX/BBVA y quiero ver dónde tengo descuentos hoy."
- "Quiero descuentos en supermercado, moda, electro, gastronomía, belleza o transporte."
- "Estoy cerca de una zona comercial y quiero ver beneficios cercanos."
- "Quiero saber si una promo aplica hoy, cuál es el tope y si tiene cuotas."

## Personas
| Persona | Cares about | Challenge | Value we promise |
|---------|-------------|-----------|------------------|
| Usuario ahorrador cotidiano | Ahorrar plata en compras frecuentes | Las promociones están dispersas entre bancos, billeteras y comercios | Ver en un solo lugar descuentos vigentes, topes, días y condiciones |
| Comparador antes de comprar | Maximizar ahorro en compras grandes | No sabe si conviene descuento, cuotas o billetera | Comparar bancos, cuotas y topes antes de pagar |
| Usuario mobile local | Encontrar beneficios cerca suyo | Las promos no siempre están asociadas a ubicación o sucursal | Mapa, geolocalización y comercios cercanos con beneficios |
| Cazador de promos/comunidad | Compartir datos útiles y promociones actuales | Necesita links concretos, condiciones y vigencia verificable | Fichas específicas de comercio/beneficio listas para consultar y compartir |
| Proveedor de beneficios (futuro B2B) | Que sus afiliados confíen y usen sus convenios | Los convenios quedan como listados estáticos, desactualizados y poco medibles | Catálogo co-branded, acceso validado y métricas de intención |

## Problems & Pain Points
**Core problem:** En Argentina hay muchas promociones, pero están fragmentadas, cambian seguido y tienen condiciones difíciles de comparar.

**Why alternatives fall short:**
- Las webs de bancos y billeteras muestran promociones propias, no una comparación transversal.
- Los listados de comercios o convenios suelen estar desactualizados, incompletos o sin filtros útiles.
- Las redes y comunidades ayudan a descubrir promos, pero no siempre ordenan vigencia, topes, días y condiciones.
- Buscar manualmente antes de cada compra toma tiempo y genera dudas sobre si la promo aplica.

**What it costs them:** Plata perdida por no usar el mejor descuento, tiempo revisando múltiples fuentes, compras hechas con el medio de pago incorrecto y oportunidades desaprovechadas por no conocer topes o días de vigencia.

**Emotional tension:** "Seguro había una promo mejor y me enteré tarde"; "No sé si esto aplica hoy"; "No quiero llegar a la caja y que el descuento no funcione"; "Hay demasiadas condiciones para comparar rápido".

## Competitive Landscape
**Direct:** PromoArg (promoarg.com) y otros sitios/apps de promociones bancarias. PromoArg compite en búsqueda de descuentos por banco/tarjeta, selección de bancos, alertas, calculadora de ahorro y promesa de actualización frecuente. Frente a Blink, el espacio a defender es cobertura real de inventario, fichas por comercio/beneficio, SEO por comercio/categoría, experiencia mobile y beneficios de Mercado Pago operativos en el buscador.

**Direct/adjacent:** Clash (clash.com.ar). Clash se posiciona como red social/app de promociones y plataforma para que comercios, centros comerciales, clubes de beneficios y medios de pago publiquen, midan y validen promociones con QR, micrositios y panel. Compite por atención del usuario y por el lado B2B de gestión/comunicación de promociones, pero su foco público parece más orientado a comercios y ecosistema de publicación que a buscador SEO-first de beneficios bancarios.

**Secondary:** Webs y apps de bancos, billeteras y programas como Galicia, Santander, BBVA, Macro, NaranjaX, Mercado Pago, MODO, ICBC, Buepp, Personal Pay. Fallan porque cada una muestra su propio universo y obliga al usuario a comparar manualmente.

**Indirect:** Comunidades como Reddit/WhatsApp/Telegram, influencers de cupones, newsletters, Google y memoria personal del usuario. Fallan porque mezclan datos útiles con ruido, no siempre están actualizadas y no estructuran condiciones para decidir rápido.

## Differentiation
**Key differentiators:**
- Inventario amplio de beneficios argentinos, con métricas públicas actuales de 31.351 beneficios, 3.368 online y 27.983 físicos al 2026-06-17.
- Cobertura de promociones de Mercado Pago en el buscador. Claim estratégica actual del equipo: Blink es el único buscador del set competitivo identificado con promos de Mercado Pago operativas y buscables. Revalidar antes de usar la palabra "único" en copy público porque competidores pueden cambiar cobertura o mencionarla en marketing.
- Búsqueda por comercio, banco, categoría, beneficio y ubicación.
- Filtros por descuento mínimo, cuotas, día, crédito/débito, online y cercanía.
- Fichas por comercio y beneficio con condiciones, topes, vigencia y sucursales cuando existen.
- Distribución SEO con páginas por comercio, categoría y combinaciones banco/categoría/ciudad.
- Experiencia mobile/PWA con guardados, mapa y notificaciones.

**How we do it differently:** Blink convierte promociones dispersas en un buscador estructurado, con entidades de comercio, bancos, categorías, ubicaciones y condiciones consultables. No se limita a publicar una lista; organiza el dato para que el usuario pueda decidir antes de pagar.

**Why that's better:** Reduce tiempo de búsqueda, baja la incertidumbre y ayuda a elegir el medio de pago correcto para maximizar ahorro real.

**Why customers choose us:** Porque quieren una respuesta rápida y accionable: qué promoción usar, dónde, cuándo, con qué banco/billetera, con qué tope y bajo qué condiciones.

## Objections
| Objection | Response |
|-----------|----------|
| "No sé si la promo está vigente o si el comercio la va a tomar." | Blink muestra vigencia, días, condiciones y fuente cuando están disponibles, pero debe comunicar que la condición final depende del banco, billetera o programa emisor. |
| "Ya miro las promos en mi banco." | Blink sirve para comparar entre bancos, billeteras y comercios, no solo para ver el catálogo de una entidad. |
| "Hay demasiadas condiciones, prefiero no revisar." | La propuesta es simplificar: búsqueda, filtros y fichas que resumen descuento, tope, días, cuotas y modalidad. |
| "No quiero instalar otra app." | Blink funciona como web app/PWA y se puede usar desde el navegador; instalarla en inicio suma acceso rápido y notificaciones. |

**Anti-persona:** Usuarios que nunca modifican su medio de pago por promociones, compradores que no quieren revisar condiciones antes de pagar, o personas que buscan cupones garantizados por el comercio sin leer términos del emisor.

## Switching Dynamics
**Push:** Cansancio de revisar muchas webs de bancos, confusión por topes y condiciones, promociones que cambian, miedo a pagar con el medio incorrecto.

**Pull:** Un buscador único, filtros claros, comercios concretos, beneficios activos, mapa, guardados, notificaciones y fichas compartibles.

**Habit:** Seguir usando la app del banco principal, preguntar en grupos, buscar en Google, confiar en memoria o revisar recién cuando aparece una promo viral.

**Anxiety:** Que el dato no esté actualizado, que la promo no aplique en caja, que falte su banco o que usar Blink agregue fricción antes de comprar.

## Customer Language
**How they describe the problem:**
- "¿Qué descuento hay hoy en [comercio]?"
- "¿Con qué banco me conviene pagar?"
- "¿Cuál es el tope?"
- "¿Aplica hoy?"
- "¿Tiene cuotas sin interés?"
- "¿Sirve online o solo presencial?"
- "¿Hay algo cerca mío?"
- "Igual andá a saber si andan estos beneficios."

**How they describe us:**
- "Un buscador de promociones."
- "Un lugar para ver descuentos bancarios."
- "Una app para revisar beneficios antes de pagar."
- "Un comparador de bancos, billeteras, cuotas y topes."

**Words to use:** promociones, descuentos, beneficios, ahorro, banco, billetera, tarjeta, cuotas, tope, vigencia, condiciones, hoy, cerca tuyo, online, comercios, Argentina, antes de pagar.

**Words to avoid:** cashback garantizado, descuento garantizado, beneficio asegurado, cupón mágico, gratis absoluto, promesas que dependan de aceptación final del comercio o banco.

**Glossary:**
| Term | Meaning |
|------|---------|
| Beneficio | Promoción, descuento, reintegro, cuota o ventaja asociada a banco, billetera, tarjeta, club o suscripción |
| Tope | Monto máximo de reintegro o ahorro informado por la promoción |
| Vigencia | Período en el que el beneficio se informa como activo |
| Días de aplicación | Días de la semana en los que aplica el beneficio |
| Comercio | Marca, local, cadena o merchant donde se puede usar un beneficio |
| Emisor | Banco, billetera, tarjeta, club o programa que ofrece el beneficio |
| MODO | Billetera/red de pagos que concentra beneficios de bancos adheridos |
| PWA | Web app instalable en pantalla de inicio |

## Brand Voice
**Tone:** Útil, directo, cotidiano y argentino. Debe sonar como alguien que ayuda a ahorrar sin exagerar.

**Style:** Conversacional, claro y accionable. Priorizar datos concretos: comercio, porcentaje, tope, día, vigencia, medio de pago y link.

**Personality:** Práctico, confiable, cercano, rápido, transparente.

## Visual Identity & Brand Palette
**Source:** `/Users/tomas/Downloads/blink-paleta-marca.pdf`, paleta final de marca al 2026-06-26.

**Marketing use:** Usar esta paleta para generación de imágenes promocionales, placas sociales, creatividades de campaña, assets de performance, landings, emails y cualquier otro elemento visual de marketing de Blink.

**Color strategy:** La paleta combina el violeta y negro de "home" con el verde de "search". Cada color tiene un rol fijo: si algo comunica descuento, ahorro, éxito o "pagás menos", va en verde; si es una acción, CTA, link o elemento que debe asociarse a Blink, va en violeta.

| Role | HEX | Use |
|------|-----|-----|
| Primario / Acción | `#4338CA` | Botones, CTAs, links y elementos que deben asociarse directamente a Blink. |
| Acento / Brillo | `#676BF2` | Gradientes, estados hover y fondos vivos. No usar con texto chico encima. |
| Ahorro / Éxito | `#059669` | Descuentos, números positivos, ahorro, "pagás menos", ticks y datos que deben cargar el significado del producto. |
| Texto / Titulares | `#1C1C1E` | Texto principal y titulares. Usar este negro real en vez de `#000000`. |
| Fondo suave | `#EEF2FF` | Fondos de placas, cards y secciones. |
| Base | `#FFFFFF` | Fondo limpio, respiración y texto sobre violeta o verde cuando el contraste aplica. |

**Composition rule:** Aplicar 60-30-10 en piezas promocionales. Usar 60% base (`#FFFFFF` o `#EEF2FF`) como lienzo; 30% estructura con primario (`#4338CA`) y texto (`#1C1C1E`); 10% acento con ahorro (`#059669`) o un toque de brillo (`#676BF2`). Para una placa de simulación de ahorro: fondo `#EEF2FF`, titular/texto `#1C1C1E`, CTA `#4338CA`, número de ahorro en `#059669`.

**Safe contrast combinations:**
- `#1C1C1E` sobre `#FFFFFF` o `#EEF2FF`: seguro para texto chico y grande.
- `#FFFFFF` sobre `#4338CA`: seguro para botones y CTAs.
- `#059669` sobre `#FFFFFF`: ideal para números, precios y mensajes de ahorro.
- `#FFFFFF` sobre `#676BF2` o `#059669`: solo para texto grande, títulos o números gigantes; no usar para texto chico.

**Avoid:**
- No usar el verde `#059669` para algo que no sea ahorro, descuento, éxito o dato positivo.
- No poner texto chico sobre `#676BF2`; para botones usar siempre `#4338CA`.
- No usar texto `#676BF2` sobre `#EEF2FF`; tiene poco contraste.
- No mezclar neutros cálidos como `#F7F6F4` con los lavanda fríos; Blink debe quedarse en el mundo frío.
- No usar más de dos colores fuertes por placa; violeta + verde ya dan suficiente contraste.
- No tratar `#7C86F7` como color de marca; queda reservado solo para degradés si hace falta.
- No usar `#F1F3FE` ni `#E9EDFB` como fondos de marca porque son redundantes frente a `#EEF2FF`.

**Image generation guidance:** Al pedir imágenes promocionales, especificar "Blink brand palette: primary violet `#4338CA`, savings green `#059669`, dark text `#1C1C1E`, soft lavender `#EEF2FF`, white `#FFFFFF`". Priorizar composiciones limpias, mucho aire, texto legible, números de ahorro en verde, CTAs en violeta y no más de dos colores fuertes.

## Proof Points
**Metrics:**
- 31.351 beneficios publicados en la API pública al 2026-06-17.
- 3.368 beneficios online y 27.983 beneficios físicos al 2026-06-17.
- Categorías con más inventario al 2026-06-17: moda, otros, hogar, supermercado/shopping, belleza, electro, automotores y gastronomía.
- Bancos/billeteras con más inventario al 2026-06-17: NaranjaX, Santander, Galicia, Macro, BBVA, Buepp, Mercado Pago, ICBC, La Gaceta, Ciudad, Brubank, Personal Pay e Hipotecario.
- Sitemap local con 25.642 URLs, incluyendo 25.452 fichas de comercios, 174 landings de descuentos y 13 páginas de categorías.

**Customers:** Por validar. No hay logos/testimonios de clientes en el repo.

**Testimonials:**
> Por validar con usuarios reales.

**Value themes:**
| Theme | Proof |
|-------|-------|
| Comparación antes de pagar | Filtros por banco, categoría, descuento, cuotas, día, tarjeta, online y cercanía |
| Cobertura amplia | Más de 31k beneficios publicados al 2026-06-17 |
| Cobertura de Mercado Pago | Diferenciador estratégico actual según el equipo: promos de Mercado Pago operativas en el buscador de Blink |
| Descubrimiento SEO | Páginas por comercio, categoría y descuentos banco/categoría/ciudad |
| Uso recurrente | Guardados, notificaciones, mapa y PWA instalable |
| Claridad operativa | Fichas con topes, vigencia, condiciones, sucursales y medios de pago cuando están disponibles |

## Goals
**Business goal:** Por validar. Hipótesis actual: crecer usuarios orgánicos y recurrentes que consultan Blink antes de comprar; validar canales de adquisición como SEO y comunidad; preparar monetización futura por partnerships, afiliación o B2B.

**Conversion action:** Principal: usar el buscador y abrir una ficha de comercio/beneficio. Secundarias: instalar PWA, activar notificaciones, guardar comercios, crear cuenta, compartir links o volver desde campañas UTM.

**Current metrics:** Hay tracking con GA4/PostHog, eventos de búsqueda, filtros, selección de comercio, vista de beneficio, guardado, compartir y navegación. No hay métricas de negocio consultables en este contexto salvo inventario público de beneficios/categorías/bancos.

## AI SEO Resources
**AI visibility spreadsheet:** https://docs.google.com/spreadsheets/d/10oUAX5rGXhoGB9satOnORZCTskciYqk-INeyF_shkJo/edit?gid=0#gid=0

**Use:** Recurso para la skill `ai-seo`. Usar esta planilla como fuente de trabajo/seguimiento para queries, competidores, presencia en respuestas de IA, citas, gaps y evolución mes a mes.

**Note:** Verificar el contenido de la planilla en cada corrida antes de tomar decisiones, porque puede cambiar fuera del repo.

## Open Questions To Validate
- ¿Cuál es el objetivo principal de negocio para los próximos 90 días: tráfico SEO, usuarios recurrentes, instalaciones PWA, cuentas, notificaciones, afiliación o B2B?
- ¿El modelo de negocio deseado es afiliados, ads, featured listings, partnerships con bancos/comercios, B2B para proveedores o una combinación?
- ¿Qué promesa quieren hacer sobre frescura/validación de datos sin sobreprometer aceptación final?
- ¿Cómo quieren formular públicamente la claim de Mercado Pago: "único buscador", "mayor cobertura", "incluye Mercado Pago" o una comparación acotada contra PromoArg/Clash?
- ¿Cuáles son las 3 objeciones reales que escuchan de usuarios?
- ¿Qué lenguaje exacto usan los usuarios cuando recomiendan Blink o se quejan de las alternativas?
