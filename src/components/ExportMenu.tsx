import { useState, useRef, useEffect } from 'react'
import { Download, Loader2, ChevronDown, FileSpreadsheet, FileText, X } from 'lucide-react'
import { downloadCsv, downloadXlsx, downloadPdf, type ExportColumn } from '../lib/exportTable'
import { localIsoDate } from '../lib/format'

interface ExportMenuProps<T> {
  /** Filename stem; a `-YYYY-MM-DD.csv` suffix is appended. */
  filenameBase: string
  columns: ExportColumn<T>[]
  /** Fetch every row to export. Report progress via the callback. */
  loadRows: (onProgress: (loaded: number) => void) => Promise<{ rows: T[]; truncated: boolean }>
  disabled?: boolean
}

/**
 * Reusable "Export" dropdown for list pages. Pulls the full filtered result set
 * (not just the loaded virtual rows) and downloads it. CSV today; the menu is
 * structured so further formats slot in beside it.
 */
export function ExportMenu<T>({ filenameBase, columns, loadRows, disabled }: ExportMenuProps<T>) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(0)
  // Inline, non-blocking feedback after an export: a neutral notice (row cap) or an error.
  const [message, setMessage] = useState<{ kind: 'notice' | 'error'; text: string } | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const runExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    setOpen(false)
    setBusy(true)
    setLoaded(0)
    setMessage(null)
    try {
      const { rows, truncated } = await loadRows(setLoaded)
      const stamp = localIsoDate()
      const name = `${filenameBase}-${stamp}`
      if (format === 'csv') {
        downloadCsv(`${name}.csv`, columns, rows)
      } else if (format === 'xlsx') {
        await downloadXlsx(`${name}.xlsx`, columns, rows)
      } else {
        await downloadPdf(`${name}.pdf`, columns, rows, filenameBase)
      }
      if (truncated) {
        setMessage({
          kind: 'notice',
          text: `Export capped at ${rows.length.toLocaleString()} rows. Narrow the filters for a complete export.`,
        })
      }
    } catch (e) {
      console.error('[export]', format, e)
      setMessage({ kind: 'error', text: 'Export failed. Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={disabled || busy}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {busy ? `Exporting… ${loaded.toLocaleString()}` : 'Export'}
        {!busy && <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg">
          <button
            onClick={() => runExport('csv')}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted"
          >
            <Download className="h-4 w-4 text-muted-foreground" /> Download CSV
          </button>
          <button
            onClick={() => runExport('xlsx')}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted"
          >
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" /> Download Excel
          </button>
          <button
            onClick={() => runExport('pdf')}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted"
          >
            <FileText className="h-4 w-4 text-muted-foreground" /> Download PDF
          </button>
        </div>
      )}
      {message && !open && (
        <div
          role={message.kind === 'error' ? 'alert' : 'status'}
          className={`absolute right-0 z-20 mt-1 flex w-72 items-start gap-2 rounded-lg border px-3 py-2 text-sm shadow-lg ${
            message.kind === 'error'
              ? 'border-destructive/40 bg-card text-destructive'
              : 'border-border bg-card text-muted-foreground'
          }`}
        >
          <span className="flex-1">{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            aria-label="Dismiss"
            className="shrink-0 rounded p-0.5 hover:bg-muted"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
