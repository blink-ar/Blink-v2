import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadDeferredFonts } from '../deferredFonts';

const MATERIAL_SYMBOLS_LINK_SELECTOR = 'link[data-deferred-font="material-symbols"]';
const MATERIAL_SYMBOLS_READY_CLASS = 'material-symbols-ready';
const ORIGINAL_PERFORMANCE_OBSERVER = window.PerformanceObserver;
const ORIGINAL_DOCUMENT_FONTS = Object.getOwnPropertyDescriptor(document, 'fonts');

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

function mockDocumentFonts(fonts: Pick<FontFaceSet, 'check' | 'load'>): void {
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: fonts,
  });
}

function restoreDocumentFonts(): void {
  if (ORIGINAL_DOCUMENT_FONTS) {
    Object.defineProperty(document, 'fonts', ORIGINAL_DOCUMENT_FONTS);
    return;
  }

  Reflect.deleteProperty(document, 'fonts');
}

describe('loadDeferredFonts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.documentElement.classList.remove(MATERIAL_SYMBOLS_READY_CLASS);
    document.head.querySelectorAll(MATERIAL_SYMBOLS_LINK_SELECTOR).forEach((node) => node.remove());
  });

  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.classList.remove(MATERIAL_SYMBOLS_READY_CLASS);
    document.head.querySelectorAll(MATERIAL_SYMBOLS_LINK_SELECTOR).forEach((node) => node.remove());
    Reflect.deleteProperty(document, 'readyState');
    restoreDocumentFonts();
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

  it('marks Material Symbols ready only after the deferred icon font loads', async () => {
    setDocumentReadyState('complete');
    disablePerformanceObserver();
    const flushAnimationFrames = mockAnimationFrames();
    const check = vi
      .fn<(font: string, text?: string) => boolean>()
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    const load = vi
      .fn<(font: string, text?: string) => Promise<FontFace[]>>()
      .mockResolvedValue([]);

    mockDocumentFonts({ check, load });

    loadDeferredFonts();
    vi.advanceTimersByTime(2500);
    flushAnimationFrames();

    const link = document.querySelector<HTMLLinkElement>(MATERIAL_SYMBOLS_LINK_SELECTOR);
    expect(link).not.toBeNull();
    expect(document.documentElement.classList.contains(MATERIAL_SYMBOLS_READY_CLASS)).toBe(false);

    link?.dispatchEvent(new Event('load'));
    await Promise.resolve();

    expect(load).toHaveBeenCalledWith('24px "Material Symbols Outlined"');
    expect(document.documentElement.classList.contains(MATERIAL_SYMBOLS_READY_CLASS)).toBe(true);
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
