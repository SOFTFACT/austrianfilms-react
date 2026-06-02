/**
 * Client-side table export. CSV only for now (zero dependencies, opens natively
 * in Excel). A native .xlsx path can be added later via SheetJS' official CDN
 * build — the npm `xlsx` package carries a high-severity advisory we avoid.
 */

export interface ExportColumn<T> {
  header: string
  value: (row: T) => string | number | boolean | null | undefined
}

/** RFC 4180 cell quoting. Internal/trusted data, so no formula-injection mangling. */
function csvCell(value: string | number | boolean | null | undefined): string {
  if (value == null) return ''
  const s = String(value)
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

export function rowsToCsv<T>(columns: ExportColumn<T>[], rows: T[]): string {
  const head = columns.map((c) => csvCell(c.header)).join(',')
  const body = rows.map((r) => columns.map((c) => csvCell(c.value(r))).join(',')).join('\r\n')
  return body ? head + '\r\n' + body : head
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function downloadCsv<T>(filename: string, columns: ExportColumn<T>[], rows: T[]): void {
  const csv = rowsToCsv(columns, rows)
  // Prepend a UTF-8 BOM (﻿) so Excel reads umlauts/diacritics correctly.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, filename)
}
