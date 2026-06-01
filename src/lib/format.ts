/** Shared display formatters. */

/** ISO-Datum → dd.MM.yyyy. Leeres/Null-Datum (auch 4D `!00-00-00!`) → ''. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return '' // non-ISO (e.g. 4D empty-date literal "!00-00-00!")
  if (m[1] === '0000') return ''
  return `${m[3]}.${m[2]}.${m[1]}`
}

/** Betrag mit Währung, deutsche Notation. */
export function formatCurrency(value: number, currency = 'EUR'): string {
  try {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(value)
  } catch {
    // Unbekannter Währungscode → Zahl + Code-Suffix.
    return `${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
  }
}
