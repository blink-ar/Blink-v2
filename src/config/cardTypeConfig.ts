/**
 * Card type display configuration.
 *
 * There are two mechanisms:
 *
 *  1. CARD_TYPE_BLOCKLIST  — card types that should never appear in the UI.
 *     A card type is blocked if its lowercase name contains any entry.
 *
 *  2. CARD_TYPE_DISPLAY_MAP — rename / normalise raw card type strings.
 *     Keys are lowercase trimmed names as they come from the database.
 *     Values are the display labels shown to the user.
 *
 *     Rule of thumb:
 *       - Non-tier variants (classic, standard, recargable, debito,
 *         internacional, regional, nacional …) → collapse to brand name.
 *       - Tier variants (Gold, Platinum, Black, Signature, Infinite …)
 *         → keep them, they are meaningful to the user.
 *
 * After applying both rules the list is automatically deduplicated
 * (case-insensitive), so mapping several raw names to the same display
 * label naturally produces a single badge.
 */

// ---------------------------------------------------------------------------
// 1. Blocklist — hide these card types entirely
// ---------------------------------------------------------------------------

export const CARD_TYPE_BLOCKLIST: string[] = [
  'default',
];

// ---------------------------------------------------------------------------
// 2. Display name map — normalise / rename raw card type strings
// ---------------------------------------------------------------------------

export const CARD_TYPE_DISPLAY_MAP: Record<string, string> = {
  // ── Visa – base / non-tier variants ────────────────────────────────────
  'visa': 'Visa',
  'visa standar': 'Visa',
  'visa standard': 'Visa',
  'visa classic': 'Visa',
  'visa recargable': 'Visa',
  'visa débito': 'Visa',
  'visa debito': 'Visa',
  'visa internacional': 'Visa',
  'visa nacional': 'Visa',

  // ── Visa – tier variants (kept) ─────────────────────────────────────────
  'visa gold': 'Visa Gold',
  'visa platinum': 'Visa Platinum',
  'visa black': 'Visa Black',
  'visa signature': 'Visa Signature',
  'visa infinite': 'Visa Infinite',

  // ── Mastercard – base / non-tier variants ───────────────────────────────
  'mastercard': 'Mastercard',
  'mastercard standar': 'Mastercard',
  'mastercard standard': 'Mastercard',
  'mastercard classic': 'Mastercard',
  'mastercard débito': 'Mastercard',
  'mastercard debito': 'Mastercard',
  'mastercard internacional': 'Mastercard',
  'mastercard regional': 'Mastercard',
  'mastercard nacional': 'Mastercard',

  // ── Mastercard – tier variants (kept) ───────────────────────────────────
  'mastercard gold': 'Mastercard Gold',
  'mastercard platinum': 'Mastercard Platinum',
  'mastercard black': 'Mastercard Black',

  // ── American Express – base / non-tier variants ─────────────────────────
  'amex': 'American Express',
  'american express': 'American Express',
  'amex standar': 'American Express',
  'amex standard': 'American Express',
  'amex internacional': 'American Express',
  'american express standar': 'American Express',
  'american express standard': 'American Express',
  'american express internacional': 'American Express',

  // ── American Express – tier variants (kept) ─────────────────────────────
  'amex gold': 'American Express Gold',
  'amex platinum': 'American Express Platinum',
  'amex black': 'American Express Black',
  'american express gold': 'American Express Gold',
  'american express platinum': 'American Express Platinum',
  'american express black': 'American Express Black',

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
 *  4. Deduplicates case-insensitively (preserves first-occurrence order)
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
