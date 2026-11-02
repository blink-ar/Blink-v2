// These are app screens, not search landing pages. Keep them usable and
// crawlable so robots can see noindex, without advertising homepage schema.
const APP_PAGES = {
  map: ['Mapa de descuentos bancarios cercanos', 'Explora descuentos bancarios cercanos en el mapa.'],
  profile: ['Mi perfil', 'Administra tu perfil de Blink.'],
  saved: ['Mis guardados', 'Consulta tus beneficios guardados en Blink.'],
  login: ['Iniciar sesión', 'Inicia sesión en Blink.'],
  signup: ['Crear cuenta', 'Crea tu cuenta en Blink.'],
  notifications: ['Notificaciones', 'Consulta tus notificaciones de Blink.'],
  'auth/callback': ['Iniciando sesión', 'Completa el acceso a Blink.'],
};

export function renderAppSeoHtml(appShell, page, siteUrl) {
  const definition = Object.hasOwn(APP_PAGES, page) ? APP_PAGES[page] : null;
  if (!definition) return null;
  const [title, description] = definition;
  const canonical = new URL(`/${page}`, siteUrl).href;
  const robots = page === 'map' ? 'noindex, follow' : 'noindex, nofollow';
  const shell = appShell
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+(name|property)=["'](?:description|robots|keywords|og:[^"']+|twitter:[^"']+)["'][^>]*>\s*/gi, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, '')
    .replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi, '');
  return shell.replace('</head>', [
    `<title>${title} | Blink</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${canonical.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}" />`,
    '</head>',
  ].join('\n'));
}
