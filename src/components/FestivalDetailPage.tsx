import { type ReactNode } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useFestival } from '../hooks/useFestivals'
import { formatDate } from '../lib/format'
import { festivalRatingLabel } from '../types/festival'
import { Flag } from './Flag'

function Field({ label, value }: { label: string; value: ReactNode }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="border-b border-border py-2">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  )
}

export function FestivalDetailPage() {
  const { id } = useParams()
  const { data: f, isLoading, error } = useFestival(id)

  return (
    <div className="p-4 md:p-6">
      <Link to="/festivals" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to festivals
      </Link>

      {isLoading ? (
        <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : error || !f ? (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">Festival not found.</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <Flag code={f.countryCode} className="mb-2 h-6 w-9 rounded-sm border border-border object-cover" />
              <dl>
                <Field label="City" value={f.ort} />
                <Field label="Country" value={f.land || f.countryCode} />
                <Field
                  label="Rating"
                  value={
                    f.rating ? (
                      <span className="text-amber-500" title={festivalRatingLabel(f.rating)}>
                        {'★'.repeat(Math.min(f.rating, 5))}
                      </span>
                    ) : (
                      ''
                    )
                  }
                />
                <Field label="From" value={formatDate(f.von)} />
                <Field label="To" value={formatDate(f.bis)} />
                <Field label="Year" value={f.jahr || ''} />
              </dl>
            </div>
            {(f.earlyDeadline || f.regularDeadline || f.finalDeadline) && (
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Deadlines</div>
                <dl>
                  <Field label="Early" value={formatDate(f.earlyDeadline)} />
                  <Field label="Regular" value={formatDate(f.regularDeadline)} />
                  <Field label="Final" value={formatDate(f.finalDeadline)} />
                </dl>
              </div>
            )}
          </div>

          <div>
            <h1 className="text-xl font-semibold text-foreground">{f.festival || '—'}</h1>
            {f.editionNr ? <p className="text-sm text-muted-foreground">{f.editionNr}. Edition</p> : null}
            <dl className="mt-4">
              <Field label="Organization" value={f.firma} />
              <Field label="Organization (EN)" value={f.firmaEngl} />
              <Field
                label="Email"
                value={f.emailMain ? <a href={`mailto:${f.emailMain}`} className="text-blue-600 hover:underline dark:text-blue-400">{f.emailMain}</a> : ''}
              />
              <Field
                label="Website"
                value={
                  f.websiteMain ? (
                    <a
                      href={f.websiteMain.startsWith('http') ? f.websiteMain : `https://${f.websiteMain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {f.websiteMain}
                    </a>
                  ) : (
                    ''
                  )
                }
              />
              <Field label="Notes" value={f.bemerkung} />
            </dl>
          </div>
        </div>
      )}
    </div>
  )
}
