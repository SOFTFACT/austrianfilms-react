import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { X, Loader2, ChevronDown } from 'lucide-react'
import { createFilm, updateFilm, type FilmWriteBody } from '../api/films'
import { FILM_GENRES, type Film } from '../types/film'
import type { ApiError } from '../api/client'
import { cn } from '../lib/utils'

/** Text/number field row used throughout the form. */
function FieldInput({
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-slate-900"
      />
    </div>
  )
}

/**
 * Create/edit a film. Pass `film` to edit (PUT /fmfilms/:id), omit to create
 * (POST /fmfilms). Mirrors the field set of the legacy /hq film modal.
 */
export function FilmFormModal({ film, onClose }: { film?: Film; onClose: () => void }) {
  const qc = useQueryClient()
  const isEdit = !!film

  // Core fields
  const [titel, setTitel] = useState(film?.titel ?? '')
  const [englischerTitel, setEnglischerTitel] = useState(film?.englischerTitel ?? '')
  const [produktionsjahr, setProduktionsjahr] = useState(
    film?.produktionsjahr ? String(film.produktionsjahr) : '',
  )
  const [genre, setGenre] = useState(film?.genre ? String(film.genre) : '')
  const [regie, setRegie] = useState(film?.regie ?? '')
  const [produktion, setProduktion] = useState(film?.produktion ?? '')

  // Additional details
  const [showDetails, setShowDetails] = useState(false)
  const [kategorie, setKategorie] = useState(film?.kategorie ?? '')
  const [filmgenre, setFilmgenre] = useState(film?.filmgenre ?? '')
  const [betreuung, setBetreuung] = useState(film?.betreuung ?? '')
  const [minuten, setMinuten] = useState(film?.minuten ? String(film.minuten) : '')
  const [format, setFormat] = useState(film?.format ?? '')
  const [originalsprache, setOriginalsprache] = useState(film?.originalsprache ?? '')
  const [weltvertrieb, setWeltvertrieb] = useState(film?.weltvertrieb ?? '')
  const [filmwebsite, setFilmwebsite] = useState(film?.filmwebsite ?? '')
  const [bemerkung, setBemerkung] = useState(film?.bemerkung ?? '')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (!titel.trim()) {
      setError('Title is required.')
      return
    }
    const year = Number(produktionsjahr)
    if (!produktionsjahr || Number.isNaN(year) || year < 1900 || year > 2100) {
      setError('Production year is required and must be between 1900 and 2100.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      const body: FilmWriteBody = {
        titel: titel.trim(),
        produktionsjahr: year,
        englischerTitel: englischerTitel || undefined,
        genre: genre ? Number(genre) : undefined,
        regie: regie || undefined,
        produktion: produktion || undefined,
        kategorie: kategorie || undefined,
        filmgenre: filmgenre || undefined,
        betreuung: betreuung || undefined,
        minuten: minuten || undefined,
        format: format || undefined,
        originalsprache: originalsprache || undefined,
        weltvertrieb: weltvertrieb || undefined,
        filmwebsite: filmwebsite || undefined,
        bemerkung: bemerkung || undefined,
      }
      if (isEdit) {
        await updateFilm(film!.id, body)
        await qc.invalidateQueries({ queryKey: ['film', film!.id] })
      } else {
        await createFilm(body)
      }
      await qc.invalidateQueries({ queryKey: ['films'] })
      onClose()
    } catch (err) {
      setError((err as ApiError).detail || (err as ApiError).title || 'Failed to save film.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="mt-10 w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-base font-semibold text-slate-900">{isEdit ? 'Edit film' : 'New film'}</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <FieldInput label="Title" value={titel} onChange={setTitel} required placeholder="Film title" />
          <FieldInput
            label="English title"
            value={englischerTitel}
            onChange={setEnglischerTitel}
            placeholder="English title"
          />
          <div className="grid grid-cols-2 gap-3">
            <FieldInput
              label="Production year"
              value={produktionsjahr}
              onChange={setProduktionsjahr}
              type="number"
              required
              placeholder="2024"
            />
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Genre</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="">—</option>
                {FILM_GENRES.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <FieldInput label="Director" value={regie} onChange={setRegie} placeholder="Director name" />
            <FieldInput
              label="Production company"
              value={produktion}
              onChange={setProduktion}
              placeholder="Production company"
            />
          </div>

          {/* Additional details (collapsible) */}
          <button
            type="button"
            onClick={() => setShowDetails((s) => !s)}
            className="flex w-full items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
          >
            <span>Additional details</span>
            <ChevronDown className={cn('h-4 w-4 transition-transform', showDetails && 'rotate-180')} />
          </button>
          {showDetails && (
            <div className="grid grid-cols-2 gap-3">
              <FieldInput label="Category" value={kategorie} onChange={setKategorie} placeholder="e.g. Feature, Short" />
              <FieldInput label="Film genre" value={filmgenre} onChange={setFilmgenre} placeholder="e.g. Drama" />
              <FieldInput label="AFC contact" value={betreuung} onChange={setBetreuung} />
              <FieldInput label="Duration (min)" value={minuten} onChange={setMinuten} type="number" placeholder="90" />
              <FieldInput label="Format" value={format} onChange={setFormat} placeholder="e.g. DCP, 35mm" />
              <FieldInput label="Original language" value={originalsprache} onChange={setOriginalsprache} />
              <FieldInput label="World sales" value={weltvertrieb} onChange={setWeltvertrieb} />
              <FieldInput
                label="Film website"
                value={filmwebsite}
                onChange={setFilmwebsite}
                type="url"
                placeholder="https://example.com"
              />
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Notes</label>
                <textarea
                  value={bemerkung}
                  onChange={(e) => setBemerkung(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-slate-900"
                />
              </div>
            </div>
          )}

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
