/**
 * Client-side table export: CSV (zero-dep), native .xlsx, and PDF.
 *
 * .xlsx uses `write-excel-file` (lightweight, no known advisory) instead of the
 * npm `xlsx`/SheetJS package, which carries a high-severity advisory we avoid.
 * .pdf uses `jspdf` + `jspdf-autotable`. Both are loaded via dynamic import, so
 * they stay out of the initial bundle and only load when the user exports.
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

function cellText<T>(column: ExportColumn<T>, row: T): string {
  const v = column.value(row)
  return v == null ? '' : String(v)
}

/** Native .xlsx via write-excel-file (lazy-loaded; avoids the npm `xlsx` advisory). */
export async function downloadXlsx<T>(
  filename: string,
  columns: ExportColumn<T>[],
  rows: T[],
): Promise<void> {
  // write-excel-file exposes only subpath exports; /browser is the browser build.
  const { default: writeXlsxFile } = await import('write-excel-file/browser')
  // This version takes a `columns` parameter (the old `schema` was removed). Each
  // column is { header, cell(object) -> { value } }; the cell type is derived from
  // the value (always a string here).
  const columnsDef = columns.map((c) => ({
    header: c.header,
    cell: (row: T) => ({ value: cellText(c, row) }),
  }))
  // writeXlsxFile(...) returns a { toBlob, toFile } descriptor (NOT a Promise). Take
  // the Blob and download it through our own anchor helper — the same reliable path
  // CSV uses (the library's built-in toFile trigger doesn't fire without a gesture).
  const make = writeXlsxFile as unknown as (
    objects: T[],
    options: { columns: typeof columnsDef },
  ) => { toBlob: () => Promise<Blob> }
  const blob = await make(rows, { columns: columnsDef }).toBlob()
  triggerDownload(blob, filename)
}

/** Landscape table PDF via jspdf + jspdf-autotable (both lazy-loaded). */
export async function downloadPdf<T>(
  filename: string,
  columns: ExportColumn<T>[],
  rows: T[],
  title?: string,
): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  const doc = new jsPDF({ orientation: 'landscape' })
  if (title) {
    doc.setFontSize(14)
    doc.text(title, 14, 16)
  }
  autoTable(doc, {
    startY: title ? 22 : 14,
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => columns.map((c) => cellText(c, r))),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [51, 65, 85] }, // slate-700, matches the UI
  })
  doc.save(filename)
}
