/**
 * Card type display configuration.
 *
 * All Visa, Mastercard, and Amex variants (regardless of tier,
 * region, or sub-type) collapse to their base brand name.
 * Any card type not matched by the brand prefix logic can be added to
 * CARD_TYPE_DISPLAY_MAP for explicit renaming.
 *
 * CARD_TYPE_BLOCKLIST hides card types entirely (matched by substring).
 */

// ---------------------------------------------------------------------------
// 1. Blocklist — hide these card types entirely
// ---------------------------------------------------------------------------

export const CARD_TYPE_BLOCKLIST: string[] = [
  'default',
];

// ---------------------------------------------------------------------------
// 2. Display name map — explicit overrides (applied before brand detection)
// ---------------------------------------------------------------------------

export const CARD_TYPE_DISPLAY_MAP: Record<string, string> = {
  'amex': 'Amex',
  // Add more explicit overrides here as needed
};

// ---------------------------------------------------------------------------
// 3. Brand prefix rules — anything starting with these collapses to the brand
// ---------------------------------------------------------------------------

const BRAND_PREFIXES: Array<{ prefix: string; display: string }> = [
  { prefix: 'visa', display: 'Visa' },
  { prefix: 'mastercard', display: 'Mastercard' },
  { prefix: 'amex', display: 'Amex' },
  { prefix: 'american express', display: 'Amex' },
];

// ---------------------------------------------------------------------------
// 4. Processing utility
// ---------------------------------------------------------------------------

/**
 * Processes a raw list of card type strings coming from the API:
 *  1. Strips the legacy " any" suffix
 *  2. Removes entries that match the blocklist
 *  3. Applies explicit overrides from CARD_TYPE_DISPLAY_MAP
 *  4. Collapses any "visa …", "mastercard …", "amex …", or "american express …" variant
 *     to just "Visa", "Mastercard", or "Amex"
 *  5. Deduplicates case-insensitively (preserves first-occurrence order)
 */
export function processCardTypes(rawCardTypes: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of rawCardTypes) {
    const cleaned = raw.replace(/ any$/i, '').trim();
    const lower = cleaned.toLowerCase();

    if (CARD_TYPE_BLOCKLIST.some((blocked) => lower.includes(blocked))) {
      continue;
    }

    let displayName = CARD_TYPE_DISPLAY_MAP[lower] ?? cleaned;

    // Collapse any brand variant to its base name
    for (const { prefix, display } of BRAND_PREFIXES) {
      if (lower === prefix || lower.startsWith(prefix + ' ') || lower.startsWith(prefix + '-')) {
        displayName = display;
        break;
      }
    }

    const dedupeKey = displayName.toLowerCase();
    if (!seen.has(dedupeKey)) {
      seen.add(dedupeKey);
      result.push(displayName);
    }
  }

  return result;
}
