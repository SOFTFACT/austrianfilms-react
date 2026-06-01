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
        <div className="grid gap-6 md:grid-cols-[200px_1fr]">
          <div>
            {film.imageUrl ? (
              <img src={film.imageUrl} alt={film.titel} className="w-full rounded-lg border border-slate-200 object-cover" />
            ) : (
              <div className="flex aspect-[2/3] items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">
                No image
              </div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{film.titel || '—'}</h1>
            {film.englischerTitel && <p className="text-sm text-slate-500">{film.englischerTitel}</p>}
            <dl className="mt-4">
              <Field label="Production year" value={film.produktionsjahr || ''} />
              <Field label="Director" value={film.regie} />
              <Field label="Production" value={film.produktion} />
              <Field label="Category" value={film.kategorie} />
              <Field label="Genre" value={film.genreText || film.filmgenre} />
              <Field label="Format" value={film.format} />
              <Field label="Duration (min)" value={film.minuten || ''} />
              <Field label="Original language" value={film.originalsprache} />
              <Field label="World sales" value={film.weltvertrieb} />
              <Field label="Funding" value={film.finanziert} />
              <Field label="Awards" value={film.preise} />
              <Field
                label="Website"
                value={
                  film.filmwebsite ? (
                    <a href={film.filmwebsite} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                      {film.filmwebsite}
                    </a>
                  ) : (
                    ''
                  )
                }
              />
              <Field label="Note" value={film.bemerkung} />
            </dl>
          </div>
        </div>
      )}
    </div>
  )
}
