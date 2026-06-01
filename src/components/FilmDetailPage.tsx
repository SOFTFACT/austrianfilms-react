import { type ReactNode } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useFilm } from '../hooks/useFilms'

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
  const { data: film, isLoading, error } = useFilm(id)

  return (
    <div className="p-4 md:p-6">
      <Link to="/films" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to films
      </Link>

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
    </div>
  )
}
