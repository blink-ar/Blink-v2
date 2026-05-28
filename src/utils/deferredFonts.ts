const MATERIAL_SYMBOLS_STYLESHEET =
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';

const MATERIAL_SYMBOLS_LINK_SELECTOR = 'link[data-deferred-font="material-symbols"]';
const MATERIAL_SYMBOLS_READY_CLASS = 'material-symbols-ready';
const MATERIAL_SYMBOLS_FONT_DESCRIPTOR = '24px "Material Symbols Outlined"';
const FONT_LOAD_FALLBACK_DELAY_MS = 2500;

type IdleCallbackWindow = Window & {
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout?: number }
  ) => number;
};

type FontLoadingDocument = Document & {
  fonts?: FontFaceSet;
};

function markMaterialSymbolsReady(): void {
  document.documentElement.classList.add(MATERIAL_SYMBOLS_READY_CLASS);
}

function materialSymbolsFontIsReady(fonts: FontFaceSet): boolean {
  try {
    return fonts.check(MATERIAL_SYMBOLS_FONT_DESCRIPTOR);
  } catch {
    return false;
  }
}

function waitForMaterialSymbolsFont(): void {
  const fonts = (document as FontLoadingDocument).fonts;

  if (!fonts || typeof fonts.load !== 'function' || typeof fonts.check !== 'function') {
    markMaterialSymbolsReady();
    return;
  }

  if (materialSymbolsFontIsReady(fonts)) {
    markMaterialSymbolsReady();
    return;
  }

  fonts
    .load(MATERIAL_SYMBOLS_FONT_DESCRIPTOR)
    .then(() => {
      if (materialSymbolsFontIsReady(fonts)) {
        markMaterialSymbolsReady();
      }
    })
    .catch(() => {
      // Keep ligature text hidden if the icon font fails to load.
    });
}

function appendMaterialSymbolsStylesheet(): void {
  if (document.querySelector(MATERIAL_SYMBOLS_LINK_SELECTOR)) {
    waitForMaterialSymbolsFont();
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = MATERIAL_SYMBOLS_STYLESHEET;
  link.dataset.deferredFont = 'material-symbols';
  link.addEventListener('load', waitForMaterialSymbolsFont, { once: true });
  document.head.appendChild(link);
}

function runAfterInitialPaint(callback: () => void): void {
  const win = window as IdleCallbackWindow;

  const runWhenIdle = () => {
    if (typeof win.requestIdleCallback === 'function') {
      win.requestIdleCallback(callback, { timeout: 1500 });
      return;
    }

    window.setTimeout(callback, 0);
  };

  if (typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(runWhenIdle);
    });
    return;
  }

  window.setTimeout(runWhenIdle, 0);
}

function runAfterFirstContentfulPaint(callback: () => void): void {
  let scheduled = false;
  let fallbackTimeout: number | undefined;

  const schedule = () => {
    if (scheduled) {
      return;
    }

    scheduled = true;
    if (fallbackTimeout !== undefined) {
      window.clearTimeout(fallbackTimeout);
    }

    runAfterInitialPaint(callback);
  };

  if (performance.getEntriesByName('first-contentful-paint').length > 0) {
    schedule();
    return;
  }

  if (typeof window.PerformanceObserver === 'function') {
    try {
      const observer = new window.PerformanceObserver((list) => {
        const sawFirstContentfulPaint = list
          .getEntries()
          .some((entry) => entry.name === 'first-contentful-paint');

        if (sawFirstContentfulPaint) {
          observer.disconnect();
          schedule();
        }
      });

      observer.observe({ type: 'paint', buffered: true });
    } catch {
      // Older browsers may not support buffered paint observation.
    }
  }

  const queueFallback = () => {
    fallbackTimeout = window.setTimeout(schedule, FONT_LOAD_FALLBACK_DELAY_MS);
  };

  if (document.readyState === 'complete') {
    queueFallback();
    return;
  }

  window.addEventListener('load', queueFallback, { once: true });
}

export function loadDeferredFonts(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  runAfterFirstContentfulPaint(appendMaterialSymbolsStylesheet);
}
