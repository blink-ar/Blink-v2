import { BankBenefit } from '../types';
import { isBenefitActive } from './benefits';
import { parseDayAvailability, type DayAvailability } from './dayAvailabilityParser';

type WeekdayKey = Exclude<keyof DayAvailability, 'allDays' | 'customText'>;

// Indexed by Date#getDay() (0 = domingo).
const WEEKDAYS: { key: WeekdayKey; label: string }[] = [
  { key: 'sunday', label: 'domingo' },
  { key: 'monday', label: 'lunes' },
  { key: 'tuesday', label: 'martes' },
  { key: 'wednesday', label: 'miércoles' },
  { key: 'thursday', label: 'jueves' },
  { key: 'friday', label: 'viernes' },
  { key: 'saturday', label: 'sábado' },
];

export type TodayAvailability =
  | { status: 'today' }
  | { status: 'other-day'; nextDayLabel: string }
  | { status: 'unknown' }
  | { status: 'expired' };

/**
 * Answers "¿lo puedo usar hoy?" for a benefit.
 * Benefits without `cuando` are treated as valid every day (same rule the merchant page uses);
 * free text we can't parse into days is reported as `unknown` instead of guessing.
 */
export const getTodayAvailability = (
  benefit: Pick<BankBenefit, 'cuando' | 'validUntil'>,
  now: Date = new Date(),
): TodayAvailability => {
  if (!isBenefitActive(benefit, now)) return { status: 'expired' };
  if (!benefit.cuando?.trim()) return { status: 'today' };

  const availability = parseDayAvailability(benefit.cuando);
  if (!availability) return { status: 'today' };
  if (availability.allDays) return { status: 'today' };

  const today = now.getDay();
  if (availability[WEEKDAYS[today].key]) return { status: 'today' };

  for (let offset = 1; offset < 7; offset += 1) {
    const day = WEEKDAYS[(today + offset) % 7];
    if (availability[day.key]) {
      return { status: 'other-day', nextDayLabel: offset === 1 ? 'mañana' : day.label };
    }
  }

  return { status: 'unknown' };
};

export const isAvailableToday = (
  benefit: Pick<BankBenefit, 'cuando' | 'validUntil'>,
  now: Date = new Date(),
): boolean => getTodayAvailability(benefit, now).status === 'today';

const DAY_KEYWORDS: Record<WeekdayKey, string[]> = {
  monday: ['lunes', 'lun'],
  tuesday: ['martes', 'mar'],
  wednesday: ['miércoles', 'miercoles', 'mié', 'mie'],
  thursday: ['jueves', 'jue'],
  friday: ['viernes', 'vie'],
  saturday: ['sábado', 'sabado', 'sáb', 'sab'],
  sunday: ['domingo', 'dom'],
};

const isWeekdayKey = (value: string): value is WeekdayKey => value in DAY_KEYWORDS;

/**
 * Whether a benefit's `cuando` allows the given weekday ('monday'…'sunday', or 'today').
 * Uses the day parser so exclusions ("No válido los lunes") and ranges ("de lunes a viernes")
 * are honored; only text the parser can't map to any day falls back to a keyword match.
 */
export const isAvailableOnDay = (cuando: string | undefined, day: string, now: Date = new Date()): boolean => {
  const dayKey = day === 'today' ? WEEKDAYS[now.getDay()].key : day;
  if (!isWeekdayKey(dayKey)) return true;
  if (!cuando?.trim()) return true;

  const availability = parseDayAvailability(cuando);
  if (!availability || availability.allDays) return true;
  if (availability[dayKey]) return true;

  const parsedAnyDay = WEEKDAYS.some(({ key }) => availability[key]);
  if (parsedAnyDay) return false;

  const text = cuando.toLowerCase();
  return DAY_KEYWORDS[dayKey].some((keyword) => text.includes(keyword));
};
