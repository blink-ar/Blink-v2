/**
 * Helpers for benefit "tope" (spending cap) values, which are stored as
 * Argentine-formatted strings (e.g. "$100.000", "Sin tope").
 */

/**
 * Parses an Argentine-formatted tope string into a number.
 * Returns null for empty / "sin tope" / unparseable values.
 * Argentine format: "." = thousands separator, "," = decimal.
 */
export const parseTopeAmount = (tope: unknown): number | null => {
  if (tope == null) return null;
  const s = String(tope).trim();
  if (!s || /sin tope|sin l[ií]mite/i.test(s)) return null;
  const cleaned = s.replace(/[$\s]/g, '').replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

/** Formats a number as Argentine pesos (e.g. 5000 → "$5.000"). */
export const formatArgentinePeso = (amount: number): string =>
  '$' + Math.round(amount).toLocaleString('es-AR');
