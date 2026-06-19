/**
 * Helpers for benefit "tope" (spending cap) values, which are stored as
 * Argentine-formatted strings (e.g. "$100.000", "Sin tope").
 */

/**
 * Parses a tope string into a number.
 * Returns null for empty / "sin tope" / values with no amount.
 *
 * Topes may include prose around the amount (e.g. "Descuento máximo $100 por
 * compra"), so we extract the first monetary amount — preferring a $-prefixed
 * one — instead of treating the whole string as a number (which would yield NaN
 * and be misread as "uncapped"). Argentine format: "." = thousands, "," = decimal.
 */
export const parseTopeAmount = (tope: unknown): number | null => {
  if (tope == null) return null;
  const s = String(tope).trim();
  if (!s || /sin tope|sin l[ií]mite/i.test(s)) return null;
  const amountPattern = /\d[\d.]*(?:,\d+)?/;
  const token = s.match(/\$\s*(\d[\d.]*(?:,\d+)?)/)?.[1] ?? s.match(amountPattern)?.[0];
  if (!token) return null;
  const cleaned = token.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

/** Formats a number as Argentine pesos (e.g. 5000 → "$5.000"). */
export const formatArgentinePeso = (amount: number): string =>
  '$' + Math.round(amount).toLocaleString('es-AR');
