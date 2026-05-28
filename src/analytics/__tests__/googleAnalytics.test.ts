import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const GA_SCRIPT_SRC = 'https://www.googletagmanager.com/gtag/js?id=G-TEST';

describe('googleAnalytics', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST');
    document.head.innerHTML = '';
    window.dataLayer = [];
    delete window.gtag;
    Object.defineProperty(window, 'requestIdleCallback', {
      configurable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    document.head.innerHTML = '';
    window.dataLayer = [];
    delete window.gtag;
  });

  it('queues analytics config immediately but defers loading gtag.js', async () => {
    const { initializeGoogleAnalytics } = await import('../googleAnalytics');

    expect(initializeGoogleAnalytics()).toBe(true);
    expect(document.querySelector(`script[src="${GA_SCRIPT_SRC}"]`)).toBeNull();
    expect(window.dataLayer).toHaveLength(2);

    vi.advanceTimersByTime(1499);
    expect(document.querySelector(`script[src="${GA_SCRIPT_SRC}"]`)).toBeNull();

    vi.advanceTimersByTime(1);
    const script = document.querySelector<HTMLScriptElement>(`script[src="${GA_SCRIPT_SRC}"]`);
    expect(script).not.toBeNull();
    expect(script?.async).toBe(true);
  });
});
