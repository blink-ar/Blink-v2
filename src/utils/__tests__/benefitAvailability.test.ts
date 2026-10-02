import { describe, expect, it } from 'vitest';
import { getTodayAvailability, isAvailableOnDay, isAvailableToday } from '../benefitAvailability';

// Thursday, 1 Oct 2026, local noon.
const THURSDAY = new Date(2026, 9, 1, 12, 0, 0);

describe('getTodayAvailability', () => {
  it('treats benefits without days as valid today', () => {
    expect(getTodayAvailability({ cuando: undefined, validUntil: null }, THURSDAY)).toEqual({ status: 'today' });
  });

  it('detects benefits valid on the current weekday', () => {
    expect(getTodayAvailability({ cuando: 'jueves', validUntil: null }, THURSDAY)).toEqual({ status: 'today' });
    expect(getTodayAvailability({ cuando: 'todos los días', validUntil: null }, THURSDAY)).toEqual({ status: 'today' });
  });

  it('returns the next valid day otherwise', () => {
    expect(getTodayAvailability({ cuando: 'viernes', validUntil: null }, THURSDAY)).toEqual({
      status: 'other-day',
      nextDayLabel: 'mañana',
    });
    expect(getTodayAvailability({ cuando: 'lunes y martes', validUntil: null }, THURSDAY)).toEqual({
      status: 'other-day',
      nextDayLabel: 'lunes',
    });
  });

  it('reports expired benefits before looking at days', () => {
    expect(getTodayAvailability({ cuando: 'jueves', validUntil: '2020-01-01' }, THURSDAY)).toEqual({ status: 'expired' });
    expect(isAvailableToday({ cuando: 'jueves', validUntil: '2020-01-01' }, THURSDAY)).toBe(false);
  });
});

describe('isAvailableOnDay', () => {
  it('honors explicit weekday exclusions', () => {
    expect(isAvailableOnDay('No válido los lunes', 'monday')).toBe(false);
    expect(isAvailableOnDay('Todos los días excepto lunes', 'monday')).toBe(false);
    expect(isAvailableOnDay('No válido los lunes', 'tuesday')).toBe(true);
  });

  it('understands day ranges that a substring match would miss', () => {
    expect(isAvailableOnDay('Válido de lunes a viernes', 'wednesday')).toBe(true);
    expect(isAvailableOnDay('Válido de lunes a viernes', 'saturday')).toBe(false);
  });

  it('resolves "today" and treats missing or unparseable schedules leniently', () => {
    expect(isAvailableOnDay('jueves', 'today', THURSDAY)).toBe(true);
    expect(isAvailableOnDay('lunes', 'today', THURSDAY)).toBe(false);
    expect(isAvailableOnDay(undefined, 'monday')).toBe(true);
    expect(isAvailableOnDay('promo vigente', 'monday')).toBe(false);
  });
});

describe('canonical English day values from the API', () => {
  it('are understood by both helpers', () => {
    expect(isAvailableOnDay('monday, tuesday', 'monday')).toBe(true);
    expect(isAvailableOnDay('monday, tuesday', 'friday')).toBe(false);
    expect(getTodayAvailability({ cuando: 'thursday', validUntil: null }, THURSDAY)).toEqual({ status: 'today' });
    expect(getTodayAvailability({ cuando: 'friday', validUntil: null }, THURSDAY)).toEqual({
      status: 'other-day',
      nextDayLabel: 'mañana',
    });
  });
});

describe('holiday-only exceptions', () => {
  it('do not invert weekday ranges', () => {
    expect(isAvailableOnDay('Válido de lunes a viernes, excepto feriados', 'monday')).toBe(true);
    expect(isAvailableOnDay('Válido de lunes a viernes, excepto feriados', 'friday')).toBe(true);
    expect(isAvailableOnDay('Válido de lunes a viernes, excepto feriados', 'saturday')).toBe(false);
    expect(isAvailableOnDay('Martes y jueves. No válido feriados', 'tuesday')).toBe(true);
    expect(isAvailableOnDay('Martes y jueves. No válido feriados', 'monday')).toBe(false);
    expect(getTodayAvailability({ cuando: 'lunes a viernes, excepto feriados', validUntil: null }, THURSDAY)).toEqual({ status: 'today' });
  });

  it('keep real weekday exclusions working', () => {
    expect(isAvailableOnDay('Todos los días excepto lunes', 'monday')).toBe(false);
  });
});
