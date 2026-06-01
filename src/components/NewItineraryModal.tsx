import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Search, Loader2, Check } from 'lucide-react'
import { getFilms } from '../api/films'
import { getFestivals } from '../api/festivals'
import { createItinerary, type NewItineraryBody } from '../api/itineraries'
import { ITINERARY_STATUSES } from '../types/itinerary'
import { useDebounce } from '../hooks/useDebounce'
import type { ApiError } from '../api/client'

interface Picked {
  id: string
  label: string
}

/** Debounced async search-select against a Paginated endpoint. */
function EntityPicker({
  title,
  placeholder,
  value,
  onPick,
  fetcher,
}: {
  title: string
  placeholder: string
  value: Picked | null
  onPick: (p: Picked | null) => void
  fetcher: (q: string) => Promise<Picked[]>
}) {
  const [q, setQ] = useState('')
  const dq = useDebounce(q, 300)
  const { data: results = [], isFetching } = useQuery({
    queryKey: [title, 'pick', dq],
    queryFn: () => fetcher(dq),
    enabled: dq.trim().length >= 2 && !value,
  })

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm">
        <Check className="h-4 w-4 text-emerald-600" />
        <span className="min-w-0 flex-1 truncate text-slate-900">{value.label}</span>
        <button type="button" onClick={() => onPick(null)} className="text-slate-400 hover:text-slate-700">
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-300 py-2 pl-8 pr-3 text-sm outline-none focus:border-slate-900"
        />
        {isFetching && <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-slate-300" />}
      </div>
      {dq.trim().length >= 2 && results.length > 0 && (
        <div className="mt-1 max-h-44 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onPick(r)}
              className="block w-full truncate px-3 py-2 text-left text-sm hover:bg-slate-50"
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function NewItineraryModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [film, setFilm] = useState<Picked | null>(null)
  const [festival, setFestival] = useState<Picked | null>(null)
  const [statusExtern, setStatusExtern] = useState('')
  const [land, setLand] = useState('')
  const [von, setVon] = useState('')
  const [bis, setBis] = useState('')
  const [sektion, setSektion] = useState('')
  const [submissionVia, setSubmissionVia] = useState('')
  const [screeningFee, setScreeningFee] = useState('')
  const [notesPublic, setNotesPublic] = useState('')
  const [notesInternal, setNotesInternal] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (!film || !festival) {
      setError('Film and festival are required.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      const body: NewItineraryBody = {
        fk_film: film.id,
        fk_festival: festival.id,
        statusExtern: statusExtern || undefined,
        land: land || undefined,
        von: von || undefined,
        bis: bis || undefined,
        sektion: sektion || undefined,
        submissionVia: submissionVia || undefined,
        screeningFee: screeningFee || undefined,
        notesPublic: notesPublic || undefined,
        notesInternal: notesInternal || undefined,
      }
      await createItinerary(body)
      await qc.invalidateQueries({ queryKey: ['itineraries'] })
      onClose()
    } catch (err) {
      setError((err as ApiError).detail || (err as ApiError).title || 'Failed to create itinerary.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="mt-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-base font-semibold text-slate-900">New itinerary</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Film *</label>
            <EntityPicker
              title="film"
              placeholder="Search film…"
              value={film}
              onPick={setFilm}
              fetcher={async (q) => (await getFilms({ search: q, limit: 8 })).data.map((f) => ({ id: f.id, label: `${f.titel}${f.produktionsjahr ? ` (${f.produktionsjahr})` : ''}` }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Festival *</label>
            <EntityPicker
              title="festival"
              placeholder="Search festival…"
              value={festival}
              onPick={setFestival}
              fetcher={async (q) => (await getFestivals({ search: q, limit: 8 })).data.map((f) => ({ id: f.id, label: `${f.festival}${f.jahr ? ` (${f.jahr})` : ''}` }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
              <select value={statusExtern} onChange={(e) => setStatusExtern(e.target.value)} className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm">
                <option value="">—</option>
                {ITINERARY_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Country</label>
              <input value={land} onChange={(e) => setLand(e.target.value)} className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">From</label>
              <input type="date" value={von} onChange={(e) => setVon(e.target.value)} className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">To</label>
              <input type="date" value={bis} onChange={(e) => setBis(e.target.value)} className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Section</label>
              <input value={sektion} onChange={(e) => setSektion(e.target.value)} className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Submission via</label>
              <input value={submissionVia} onChange={(e) => setSubmissionVia(e.target.value)} className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Screening fee</label>
              <input value={screeningFee} onChange={(e) => setScreeningFee(e.target.value)} className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Public notes</label>
            <textarea value={notesPublic} onChange={(e) => setNotesPublic(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Internal notes</label>
            <textarea value={notesInternal} onChange={(e) => setNotesInternal(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" />
          </div>

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">Cancel</button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
