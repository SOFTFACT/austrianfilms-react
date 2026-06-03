import { useState, type ReactNode } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Pencil, Trash2, X } from 'lucide-react'
import { useFilm } from '../hooks/useFilms'
import { deleteFilm } from '../api/films'
import { FilmFormModal } from './FilmFormModal'
import type { ApiError } from '../api/client'

function Field({ label, value }: { label: string; value: ReactNode }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="border-b border-slate-100 py-2">
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{value}</dd>
    </div>
  )
}

export function FilmDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: film, isLoading, error } = useFilm(id)

  const [showEdit, setShowEdit] = useState(false)
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
      setDeleteError((err as ApiError).detail || (err as ApiError).title || 'Failed to delete film.')
      setDeleting(false)
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link to="/films" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Back to films
        </Link>
        {film && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEdit(true)}
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

      {showEdit && film && <FilmFormModal film={film} onClose={() => setShowEdit(false)} />}

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
