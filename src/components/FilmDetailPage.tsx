import { useState, type ReactNode } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Pencil, Trash2, X, Check } from 'lucide-react'
import { useFilm } from '../hooks/useFilms'
import { useFilmForm, type FilmFormState } from '../hooks/useFilmForm'
import { deleteFilm } from '../api/films'
import { FILM_GENRES, type Film } from '../types/film'
import type { ApiError } from '@/lib/api4d'

function Field({ label, value }: { label: string; value: ReactNode }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="border-b border-slate-100 py-2">
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{value}</dd>
    </div>
  )
}

/** Labeled input for the in-place edit layout. */
function EditField({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <div className="py-2">
      <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-slate-900"
      />
    </div>
  )
}

/**
 * Editable variant of the detail page. Mounted only once `film` is loaded and
 * edit mode is on, so useFilmForm captures the real values on mount. Mirrors
 * the view layout (poster left, sections right) with inputs in place.
 */
function FilmEditView({ film, onDone }: { film: Film; onDone: () => void }) {
  const { form, set, submit, saving, error } = useFilmForm(film, onDone)
  const f = (k: keyof FilmFormState) => (v: string) => set(k, v)

  return (
    <>
      {/* Action bar */}
      <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-2">
        <span className="text-sm font-medium text-amber-800">Editing film</span>
        <div className="flex items-center gap-2">
          <button onClick={onDone} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        {/* Left: poster (read-only) + quick info inputs */}
        <div className="space-y-4">
          {film.imageUrl ? (
            <img src={film.imageUrl} alt={film.titel} className="w-full rounded-lg border border-slate-200 object-cover" />
          ) : (
            <div className="flex aspect-[2/3] items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">
              No image
            </div>
          )}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <EditField label="Category" value={form.kategorie} onChange={f('kategorie')} />
            <EditField label="Production year" value={form.produktionsjahr} onChange={f('produktionsjahr')} type="number" required />
            <EditField label="Duration (min)" value={form.minuten} onChange={f('minuten')} type="number" />
            <EditField label="Format" value={form.format} onChange={f('format')} />
            <EditField label="Original language" value={form.originalsprache} onChange={f('originalsprache')} />
          </div>
        </div>

        {/* Right: titles + sections */}
        <div>
          <EditField label="Title" value={form.titel} onChange={f('titel')} required />
          <EditField label="English title" value={form.englischerTitel} onChange={f('englischerTitel')} />

          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Crew &amp; Production</div>
            <EditField label="Director" value={form.regie} onChange={f('regie')} />
            <EditField label="Production" value={form.produktion} onChange={f('produktion')} />
            <EditField label="World sales" value={form.weltvertrieb} onChange={f('weltvertrieb')} />
            <div className="py-2">
              <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Genre</label>
              <select
                value={form.genre}
                onChange={(e) => set('genre', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              >
                <option value="">—</option>
                {FILM_GENRES.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <EditField label="Film genre" value={form.filmgenre} onChange={f('filmgenre')} />
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">AFC Supervision</div>
            <EditField label="Contact" value={form.betreuung} onChange={f('betreuung')} />
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
            <EditField label="Website" value={form.filmwebsite} onChange={f('filmwebsite')} type="url" />
            <div className="py-2">
              <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">Notes</label>
              <textarea
                value={form.bemerkung}
                onChange={(e) => set('bemerkung', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {/* The director caveat, surfaced where it's edited. */}
          <p className="mt-2 text-xs text-slate-400">
            Note: the director is shown from linked person records, so an edit here saves but won't appear in the
            list/detail view.
          </p>

          {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        </div>
      </div>
    </>
  )
}

export function FilmDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: film, isLoading, error } = useFilm(id)

  const [editMode, setEditMode] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function confirmDelete() {
    if (!film) return
    setDeleteError(null)
    setDeleting(true)
    try {
      await deleteFilm(film.id)
      await qc.invalidateQueries({ queryKey: ['films'] })
      navigate('/films')
    } catch (err) {
      setDeleteError((err as ApiError).problem?.detail || (err as ApiError).problem?.title || 'Failed to delete film.')
      setDeleting(false)
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link to="/films" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Back to films
        </Link>
        {film && !editMode && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
            >
              <Pencil className="h-4 w-4" /> Edit
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : error || !film ? (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">Film not found.</div>
      ) : editMode ? (
        <FilmEditView film={film} onDone={() => setEditMode(false)} />
      ) : (
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          {/* Left: poster + quick info */}
          <div className="space-y-4">
            {film.imageUrl ? (
              <img src={film.imageUrl} alt={film.titel} className="w-full rounded-lg border border-slate-200 object-cover" />
            ) : (
              <div className="flex aspect-[2/3] items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">
                No image
              </div>
            )}
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <dl>
                <Field label="Category" value={film.kategorie} />
                <Field label="Production year" value={film.produktionsjahr || ''} />
                <Field label="Duration" value={film.minuten ? `${film.minuten} min` : ''} />
                <Field label="Format" value={film.format} />
                <Field label="Original language" value={film.originalsprache} />
              </dl>
            </div>
          </div>

          {/* Right: title + sections */}
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{film.titel || '—'}</h1>
            {film.englischerTitel && <p className="text-sm text-slate-500">{film.englischerTitel}</p>}

            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Crew &amp; Production</div>
              <dl>
                <Field label="Director" value={film.regie} />
                <Field label="Production" value={film.produktion} />
                <Field label="World sales" value={film.weltvertrieb} />
                <Field label="Funding" value={film.finanziert} />
                <Field label="Genre" value={film.filmgenre} />
              </dl>
            </div>

            {(film.betreuung || film.betreuungsjahr) && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">AFC Supervision</div>
                <dl>
                  <Field label="Contact" value={film.betreuung} />
                  <Field label="Supervision year" value={film.betreuungsjahr || ''} />
                </dl>
              </div>
            )}

            {(film.preise || film.bemerkung || film.filmwebsite) && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                <dl>
                  <Field label="Awards" value={film.preise} />
                  <Field label="Notes" value={film.bemerkung} />
                  <Field
                    label="Website"
                    value={
                      film.filmwebsite ? (
                        <a
                          href={film.filmwebsite.startsWith('http') ? film.filmwebsite : `https://${film.filmwebsite}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {film.filmwebsite}
                        </a>
                      ) : (
                        ''
                      )
                    }
                  />
                </dl>
              </div>
            )}
          </div>
        </div>
      )}

      {showDelete && film && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="mt-24 w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h2 className="text-base font-semibold text-slate-900">Delete film</h2>
              <button
                onClick={() => setShowDelete(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5 py-4 text-sm text-slate-700">
              Are you sure you want to delete <span className="font-medium text-slate-900">"{film.titel}"</span>? This
              cannot be undone.
              {deleteError && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-red-700">{deleteError}</div>}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
              <button
                onClick={() => setShowDelete(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
