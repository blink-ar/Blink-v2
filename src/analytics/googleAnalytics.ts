type AnalyticsParamValue = string | number | boolean;
type AnalyticsParams = Record<string, AnalyticsParamValue | undefined>;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID ?? '').trim();
const SCROLL_DEPTH_MARKERS = [25, 50, 75, 100];

// Maintenance note:
// If event names/params change here, update /Users/tomas/Dev/Blink/Blink-v2/ANALYTICS_EVENTS.md.
let isInitialized = false;
let lastTrackedPageView: { path: string; timestamp: number } | null = null;

function isEnabled(): boolean {
  return GA_MEASUREMENT_ID.length > 0;
}

function normalizeEventName(eventName: string): string {
  let normalized = eventName
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!normalized) {
    normalized = 'event_unknown';
  }

  if (!/^[a-z]/.test(normalized)) {
    normalized = `event_${normalized}`;
  }

  return normalized.slice(0, 40);
}

function cleanParams(params: AnalyticsParams): Record<string, AnalyticsParamValue> {
  const cleaned: Record<string, AnalyticsParamValue> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue;
    }

    const normalizedKey = key
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40);

    if (!normalizedKey) {
      continue;
    }

    if (typeof value === 'string') {
      cleaned[normalizedKey] = value.slice(0, 100);
      continue;
    }

    cleaned[normalizedKey] = value;
  }

  return cleaned;
}

function truncateText(value: string | null, maxLength = 80): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.slice(0, maxLength);
}

function elementMetadata(target: EventTarget | null): AnalyticsParams {
  if (!(target instanceof Element)) {
    return {};
  }

  const element = target as HTMLElement;
  const anchor = element.closest('a') as HTMLAnchorElement | null;
  const button = element.closest('button');
  const classes = (element.getAttribute('class') ?? '')
    .split(' ')
    .map(className => className.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join(' ');

  return {
    element_tag: element.tagName.toLowerCase(),
    element_id: element.id || undefined,
    element_role: element.getAttribute('role') || undefined,
    element_name: element.getAttribute('name') || undefined,
    element_type: element.getAttribute('type') || undefined,
    element_classes: classes || undefined,
    element_label: truncateText(
      element.getAttribute('aria-label') ||
        element.getAttribute('title') ||
        (button ? button.textContent : element.textContent),
    ),
    link_path: anchor?.pathname || undefined,
  };
}

function getFormMetadata(target: EventTarget | null): AnalyticsParams {
  if (!(target instanceof HTMLFormElement)) {
    return {};
  }

  return {
    form_action: target.getAttribute('action') || undefined,
    form_method: target.getAttribute('method') || 'get',
    form_id: target.id || undefined,
  };
}

function getKeyboardMetadata(event: Event): AnalyticsParams {
  if (!(event instanceof KeyboardEvent)) {
    return {};
  }

  const key = event.key.length === 1 ? 'character' : event.key.toLowerCase();

  return {
    keyboard_key: key,
    keyboard_ctrl: event.ctrlKey,
    keyboard_shift: event.shiftKey,
    keyboard_alt: event.altKey,
    keyboard_meta: event.metaKey,
  };
}

function getWindowPath(): string {
  if (typeof window === 'undefined') {
    return '/';
  }

  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function initializeGoogleAnalytics(): boolean {
  if (typeof window === 'undefined' || !isEnabled()) {
    return false;
  }

  if (isInitialized) {
    return true;
  }

  window.dataLayer = window.dataLayer || [];

  if (!window.gtag) {
    window.gtag = function () {
      // GA's command queue expects `arguments` objects, not rest-parameter arrays.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
  }

  const scriptSrc = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${scriptSrc}"]`);

  if (!existingScript) {
    const script = document.createElement('script');
    script.async = true;
    script.src = scriptSrc;
    document.head.appendChild(script);
  }

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false,
    anonymize_ip: true,
  });

  isInitialized = true;
  return true;
}

export function trackEvent(eventName: string, params: AnalyticsParams = {}): void {
  if (!initializeGoogleAnalytics() || !window.gtag) {
    return;
  }

  window.gtag('event', normalizeEventName(eventName), cleanParams(params));
}

export function trackPageView(path: string, title?: string): void {
  const now = Date.now();
  if (lastTrackedPageView && lastTrackedPageView.path === path && now - lastTrackedPageView.timestamp < 1000) {
    return;
  }

  lastTrackedPageView = { path, timestamp: now };

  trackEvent('page_view', {
    page_path: path,
    page_title: title || (typeof document !== 'undefined' ? document.title : ''),
    page_location: typeof window !== 'undefined' ? window.location.href : '',
  });
}

export function setupGlobalEventTracking(): () => void {
  if (!initializeGoogleAnalytics()) {
    return () => {};
  }

  const trackedEvents = [
    'click',
    'dblclick',
    'contextmenu',
    'submit',
    'change',
    'input',
    'focusin',
    'focusout',
    'keydown',
    'keyup',
    'pointerdown',
    'pointerup',
    'touchstart',
    'touchend',
    'copy',
    'cut',
    'paste',
  ] as const;

  const throttledEventState = new Map<string, number>();
  const scrollMarkersSeen = new Set<number>();
  let resizeTimeout: ReturnType<typeof window.setTimeout> | null = null;

  const baseParams = () => ({
    page_path: getWindowPath(),
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
  });

  const shouldThrottle = (event: Event): boolean => {
    if (event.type !== 'input') {
      return false;
    }

    const metadata = elementMetadata(event.target);
    const key = `${event.type}:${metadata.element_id ?? metadata.element_name ?? metadata.element_tag ?? 'unknown'}`;
    const now = Date.now();
    const previous = throttledEventState.get(key) ?? 0;

    if (now - previous < 1000) {
      return true;
    }

    throttledEventState.set(key, now);
    return false;
  };

  const onTrackedEvent = (event: Event) => {
    if (shouldThrottle(event)) {
      return;
    }

    trackEvent(event.type, {
      ...baseParams(),
      ...elementMetadata(event.target),
      ...getFormMetadata(event.target),
      ...getKeyboardMetadata(event),
      event_is_trusted: event.isTrusted,
    });
  };

  const onScroll = () => {
    const maxScrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScrollable <= 0) {
      return;
    }

    const scrollPercent = Math.round((window.scrollY / maxScrollable) * 100);

    for (const marker of SCROLL_DEPTH_MARKERS) {
      if (scrollPercent >= marker && !scrollMarkersSeen.has(marker)) {
        scrollMarkersSeen.add(marker);
        trackEvent('scroll_depth', {
          ...baseParams(),
          scroll_depth_percent: marker,
        });
      }
    }
  };

  const onResize = () => {
    if (resizeTimeout) {
      window.clearTimeout(resizeTimeout);
    }

    resizeTimeout = window.setTimeout(() => {
      trackEvent('window_resize', baseParams());
    }, 300);
  };

  const onVisibilityChange = () => {
    trackEvent('visibility_change', {
      ...baseParams(),
      visibility_state: document.visibilityState,
    });
  };

  const onError = (event: ErrorEvent) => {
    trackEvent('runtime_error', {
      ...baseParams(),
      error_message: truncateText(event.message, 100),
      error_filename: truncateText(event.filename, 100),
      error_line: event.lineno,
      error_col: event.colno,
    });
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    trackEvent('unhandled_rejection', {
      ...baseParams(),
      error_message: truncateText(String(event.reason), 100),
    });
  };

  for (const trackedEvent of trackedEvents) {
    document.addEventListener(trackedEvent, onTrackedEvent, {
      capture: true,
      passive: true,
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);

  return () => {
    for (const trackedEvent of trackedEvents) {
      document.removeEventListener(trackedEvent, onTrackedEvent, true);
    }

    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onUnhandledRejection);

    if (resizeTimeout) {
      window.clearTimeout(resizeTimeout);
    }
  };
}
