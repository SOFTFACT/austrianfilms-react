import { useState, useRef, useEffect } from 'react'
import { Download, Loader2, ChevronDown } from 'lucide-react'
import { downloadCsv, type ExportColumn } from '../lib/exportTable'

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
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const exportCsv = async () => {
    setOpen(false)
    setBusy(true)
    setLoaded(0)
    try {
      const { rows, truncated } = await loadRows(setLoaded)
      const stamp = new Date().toISOString().slice(0, 10)
      downloadCsv(`${filenameBase}-${stamp}.csv`, columns, rows)
      if (truncated) {
        alert(
          `Export capped at ${rows.length.toLocaleString()} rows. Narrow the filters for a complete export.`,
        )
      }
    } catch {
      alert('Export failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={disabled || busy}
        className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {busy ? `Exporting… ${loaded.toLocaleString()}` : 'Export'}
        {!busy && <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          <button
            onClick={exportCsv}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4 text-slate-400" /> Download CSV
          </button>
        </div>
      )}
    </div>
  )
}
