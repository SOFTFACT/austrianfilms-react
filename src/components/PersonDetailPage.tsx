import { type ReactNode } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, UserRound } from 'lucide-react'
import { usePerson } from '../hooks/usePersons'

function Field({ label, value }: { label: string; value: ReactNode }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="border-b border-slate-100 py-2">
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{value}</dd>
    </div>
  )
}

export function PersonDetailPage() {
  const { id } = useParams()
  const { data: p, isLoading, error } = usePerson(id)

  return (
    <div className="p-4 md:p-6">
      <Link to="/persons" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to persons
      </Link>

      {isLoading ? (
        <div className="flex justify-center py-12 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : error || !p ? (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">Person not found.</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[200px_1fr]">
          <div>
            {p.imageUrl ? (
              <img src={p.imageUrl} alt={p.fullName} className="w-full rounded-lg border border-slate-200 object-cover" />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-300">
                <UserRound className="h-12 w-12" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{p.fullName || '—'}</h1>
            {p.kategorie && <p className="text-sm text-slate-500">{p.kategorie}</p>}
            <dl className="mt-4">
              <Field label="Born in" value={p.born_in} />
              <Field label="Born year" value={p.born_inYear || ''} />
              <Field label="Died in" value={p.died_in} />
              <Field label="Died year" value={p.died_inYear || ''} />
              <Field
                label="Website"
                value={
                  p.website ? (
                    <a href={p.website.startsWith('http') ? p.website : `https://${p.website}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                      {p.website}
                    </a>
                  ) : (
                    ''
                  )
                }
              />
            </dl>
          </div>
        </div>
      )}
    </div>
  )
}
