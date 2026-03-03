/**
 * Card type display configuration.
 *
 * This is the single place to control how raw card type names from the
 * database are processed before being shown in the UI.
 *
 * There are two mechanisms:
 *
 *  1. CARD_TYPE_BLOCKLIST  — card types that should never appear in the UI.
 *     A card type is blocked if its name (lowercased) contains any entry.
 *     Example: "default" blocks "visa default", "mastercard default", etc.
 *
 *  2. CARD_TYPE_DISPLAY_MAP — rename / normalise card type strings.
 *     Keys are the raw lowercase names as they come from the database.
 *     Values are the display labels shown to the user.
 *     Mapping several raw names to the same display label effectively
 *     collapses them into a single entry after deduplication.
 *
 * After applying both rules the list is automatically deduplicated, so you
 * can safely map "visa gold", "visa standard", and "visa" all to "Visa" and
 * only one badge will be shown.
 */

// ---------------------------------------------------------------------------
// 1. Blocklist — hide these card types entirely
// ---------------------------------------------------------------------------

/**
 * If any word in this list appears anywhere in a card type's lowercase name
 * the card type is removed from the displayed list.
 *
 * Add new entries to hide additional types, e.g.:
 *   'prueba', 'test', 'interno'
 */
export const CARD_TYPE_BLOCKLIST: string[] = [
  'default',
];

// ---------------------------------------------------------------------------
// 2. Display name map — normalise / rename raw card type strings
// ---------------------------------------------------------------------------

/**
 * Maps raw card type names (lowercase, trimmed) to their display labels.
 *
 * Common use-cases:
 *   - Fix typos/variants  → 'visa standar' : 'Visa'
 *   - Collapse tiers      → 'visa gold'    : 'Visa'
 *   - Brand aliases       → 'amex'         : 'American Express'
 *
 * If a raw name is NOT listed here it is shown as-is (with legacy " any"
 * suffix already stripped).
 */
export const CARD_TYPE_DISPLAY_MAP: Record<string, string> = {
  // ── Visa variants ──────────────────────────────────────────────────────
  'visa': 'Visa',
  'visa standar': 'Visa',
  'visa standard': 'Visa',
  'visa classic': 'Visa',
  'visa gold': 'Visa',
  'visa recargable': 'Visa',
  'visa débito': 'Visa',
  'visa debito': 'Visa',
  'visa platinum': 'Visa Platinum',
  'visa signature': 'Visa Signature',
  'visa infinite': 'Visa Infinite',

  // ── Mastercard variants ─────────────────────────────────────────────────
  'mastercard': 'Mastercard',
  'mastercard standar': 'Mastercard',
  'mastercard standard': 'Mastercard',
  'mastercard classic': 'Mastercard',
  'mastercard gold': 'Mastercard',
  'mastercard débito': 'Mastercard',
  'mastercard debito': 'Mastercard',
  'mastercard platinum': 'Mastercard Platinum',
  'mastercard black': 'Mastercard Black',

  // ── American Express variants ───────────────────────────────────────────
  'amex': 'American Express',
  'amex gold': 'American Express Gold',
  'amex platinum': 'American Express Platinum',
  'american express': 'American Express',
  'american express standar': 'American Express',
  'american express standard': 'American Express',

  // ── Add more mappings below as needed ───────────────────────────────────
};

// ---------------------------------------------------------------------------
// 3. Processing utility
// ---------------------------------------------------------------------------

/**
 * Processes a raw list of card type strings coming from the API:
 *  1. Strips the legacy " any" suffix
 *  2. Removes entries that match the blocklist
 *  3. Applies display name normalisation from CARD_TYPE_DISPLAY_MAP
 *  4. Deduplicates the result (preserves first-occurrence order)
 *
 * @example
 *   processCardTypes(['visa', 'visa gold', 'visa standar', 'mastercard default any'])
 *   // → ['Visa', 'Mastercard'] ('default' blocked; visa variants collapsed)
 */
export function processCardTypes(rawCardTypes: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of rawCardTypes) {
    const cleaned = raw.replace(/ any$/i, '').trim();
    const lower = cleaned.toLowerCase();

    // Skip blocklisted entries
    if (CARD_TYPE_BLOCKLIST.some((blocked) => lower.includes(blocked))) {
      continue;
    }

    const displayName = CARD_TYPE_DISPLAY_MAP[lower] ?? cleaned;

    // Deduplicate case-insensitively so "visa" and "Visa" don't both appear
    const dedupeKey = displayName.toLowerCase();
    if (!seen.has(dedupeKey)) {
      seen.add(dedupeKey);
      result.push(displayName);
    }
  }

  return result;
}
