import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadDeferredFonts } from '../deferredFonts';

const MATERIAL_SYMBOLS_LINK_SELECTOR = 'link[data-deferred-font="material-symbols"]';
const ORIGINAL_PERFORMANCE_OBSERVER = window.PerformanceObserver;

function setDocumentReadyState(readyState: DocumentReadyState): void {
  Object.defineProperty(document, 'readyState', {
    configurable: true,
    value: readyState,
  });
}

function mockAnimationFrames(): () => void {
  const callbacks: FrameRequestCallback[] = [];
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    callbacks.push(callback);
    return callbacks.length;
  });

  return () => {
    while (callbacks.length > 0) {
      callbacks.shift()?.(0);
    }
    vi.runAllTimers();
  };
}

function disablePerformanceObserver(): void {
  Object.defineProperty(window, 'PerformanceObserver', {
    configurable: true,
    value: undefined,
  });
}

describe('loadDeferredFonts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.head.querySelectorAll(MATERIAL_SYMBOLS_LINK_SELECTOR).forEach((node) => node.remove());
  });

  afterEach(() => {
    vi.useRealTimers();
    document.head.querySelectorAll(MATERIAL_SYMBOLS_LINK_SELECTOR).forEach((node) => node.remove());
    Reflect.deleteProperty(document, 'readyState');
    Object.defineProperty(window, 'PerformanceObserver', {
      configurable: true,
      value: ORIGINAL_PERFORMANCE_OBSERVER,
    });
    vi.restoreAllMocks();
  });

  it('loads Material Symbols after the fallback delay and the initial paint window', () => {
    setDocumentReadyState('loading');
    disablePerformanceObserver();
    const flushAnimationFrames = mockAnimationFrames();

    loadDeferredFonts();

    expect(document.querySelector(MATERIAL_SYMBOLS_LINK_SELECTOR)).toBeNull();

    window.dispatchEvent(new Event('load'));
    expect(document.querySelector(MATERIAL_SYMBOLS_LINK_SELECTOR)).toBeNull();

    vi.advanceTimersByTime(2499);
    flushAnimationFrames();
    expect(document.querySelector(MATERIAL_SYMBOLS_LINK_SELECTOR)).toBeNull();

    vi.advanceTimersByTime(1);
    flushAnimationFrames();

    const link = document.querySelector<HTMLLinkElement>(MATERIAL_SYMBOLS_LINK_SELECTOR);
    expect(link).not.toBeNull();
    expect(link?.rel).toBe('stylesheet');
    expect(link?.href).toContain('fonts.googleapis.com/css2?family=Material+Symbols+Outlined');
  });

  it('does not append duplicate font links', () => {
    setDocumentReadyState('complete');
    disablePerformanceObserver();
    const flushAnimationFrames = mockAnimationFrames();

    loadDeferredFonts();
    loadDeferredFonts();
    vi.advanceTimersByTime(2500);
    flushAnimationFrames();

    expect(document.querySelectorAll(MATERIAL_SYMBOLS_LINK_SELECTOR)).toHaveLength(1);
  });
});
