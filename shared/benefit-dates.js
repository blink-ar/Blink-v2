const argentinaDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Argentina/Buenos_Aires',
  year: 'numeric', month: '2-digit', day: '2-digit',
});

// Date-only expiry includes the full Argentine calendar day, regardless of the
// browser/server timezone. Timestamp expiry continues to use its exact instant.
export function getArgentinaDateOnly(now = new Date()) {
  return argentinaDay.format(now);
}
