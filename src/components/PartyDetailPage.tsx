import { useState, type ReactNode } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, CheckCircle2, ExternalLink } from 'lucide-react'
import { useParty, useUpdateParty, useMarkReviewed } from '../hooks/useParties'
import { reviewClass } from './partyBits'
import { KindIcon } from './KindIcon'
import { cn } from '../lib/utils'
import type { Party, PartyChannel } from '../types/party'

function Field({ label, value }: { label: string; value: ReactNode }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="border-b border-border py-2">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {children}
    </section>
  )
}

function channelHref(c: PartyChannel): string | undefined {
  if (c.type === 'EMAIL') return `mailto:${c.value}`
  if (c.type === 'PHONE' || c.type === 'FAX') return `tel:${c.value.replace(/\s+/g, '')}`
  if (c.type === 'WEBSITE' || c.type === 'SOCIAL') return c.value.startsWith('http') ? c.value : `https://${c.value}`
  return undefined
}

function NoteEditor({ initial, saving, onSave }: { initial: string; saving: boolean; onSave: (note: string) => void }) {
  const [note, setNote] = useState(initial)
  const dirty = note !== initial
  return (
    <>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={4}
        placeholder="note"
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring"
      />
      {dirty && (
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => onSave(note)} disabled={saving} className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50">Save note</button>
          <button type="button" onClick={() => setNote(initial)} className="rounded-lg border border-border px-3 py-1.5 text-sm">Discard</button>
        </div>
      )}
    </>
  )
}

/** The provenance line of the 4D mask: kind · links · from <source> · created <day> · <check>. */
function originLine(p: Party): string {
  const parts = [p.kind, `${p.linkCount} link(s)`]
  if (p.legacySource) parts.push(`from ${p.legacySource}`)
  if (p.externalSource) parts.push(`${p.externalSource} ${p.externalId.slice(0, 8)}…`)
  if (p.createdAt) parts.push(`created ${p.createdAt.slice(0, 10)}${p.createdBy ? ` by ${p.createdBy}` : ''}`)
  return parts.join(' · ')
}

function reviewLine(p: Party): string {
  if (p.reviewState === 'checked') return `✓ checked ${p.reviewedAt.slice(0, 10)}${p.reviewedBy ? ` by ${p.reviewedBy}` : ''}`
  if (p.reviewState === 'changed') return `⚠ changed since check of ${p.reviewedAt.slice(0, 10)}`
  return 'never checked'
}

export function PartyDetailPage() {
  const { id } = useParams()
  const { data: p, isLoading, error } = useParty(id)
  const update = useUpdateParty(id)
  const review = useMarkReviewed(id)

  return (
    <div className="p-4 md:p-6">
      <Link to="/contacts" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to contacts
      </Link>

      {isLoading ? (
        <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : error || !p ? (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">Entry not found.</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[200px_1fr]">
          <div>
            {p.imageUrl ? (
              <img src={p.imageUrl} alt={p.displayName} className="w-full rounded-lg border border-border object-cover" />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground/60">
                <KindIcon kind={p.kind} className="h-12 w-12" />
              </div>
            )}
            <button
              type="button"
              onClick={() => review.mutate()}
              disabled={review.isPending || p.reviewState === 'checked'}
              className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
              title="Closes the case: sets the check mark, as the 4D mask does"
            >
              <CheckCircle2 className="h-4 w-4" /> {p.reviewState === 'checked' ? 'Checked' : 'Mark as checked'}
            </button>
          </div>

          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-foreground">{p.displayName || '—'}</h1>
            <p className="text-xs text-muted-foreground">{originLine(p)}</p>
            <p className={cn('text-xs text-muted-foreground', reviewClass(p.reviewState))}>{reviewLine(p)}</p>

            <dl className="mt-4">
              {p.kind === 'person' && <Field label="Given name" value={p.vorname} />}
              {p.kind === 'person' && <Field label="Last name" value={p.nachname} />}
              {p.kind !== 'person' && <Field label="Short name" value={p.shortName} />}
              <Field label="Title" value={p.academicTitle} />
              <Field label="Category" value={p.categoryName} />
              <Field label="Born" value={[p.bornDate?.slice(0, 10), p.bornInYear, p.bornIn].filter(Boolean).join(' · ')} />
              <Field label="Died" value={[p.diedDate?.slice(0, 10), p.diedInYear, p.diedIn].filter(Boolean).join(' · ')} />
              <Field label="Hidden on the public website" value={p.hidden ? 'yes' : ''} />
            </dl>

            <Section title="Note">
              {/* keyed by party AND stored note: a fresh editor per row and after every save, no effect needed */}
              <NoteEditor key={`${p.id}:${p.note}`} initial={p.note ?? ''} saving={update.isPending} onSave={(note) => update.mutate({ note })} />
            </Section>

            <Section title="Contact details">
              {p.channels.length === 0 ? (
                <p className="text-sm text-muted-foreground">none</p>
              ) : (
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {p.channels.map((c) => {
                    const href = channelHref(c)
                    return (
                      <li key={c.id} className="flex items-center gap-3 px-3 py-1.5 text-sm">
                        <span className="w-16 shrink-0 text-xs uppercase text-muted-foreground">{c.type}</span>
                        {href ? <a href={href} target={c.type === 'WEBSITE' || c.type === 'SOCIAL' ? '_blank' : undefined} rel="noreferrer" className="truncate text-blue-600 hover:underline dark:text-blue-400">{c.value}</a> : <span className="truncate">{c.value}</span>}
                        {c.label && <span className="text-xs text-muted-foreground">{c.label}</span>}
                        {c.preferred && <span className="ml-auto text-xs text-green-700 dark:text-green-400">preferred</span>}
                      </li>
                    )
                  })}
                </ul>
              )}
            </Section>

            {p.addresses.length > 0 && (
              <Section title="Addresses">
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {p.addresses.map((a) => (
                    <li key={a.id} className="px-3 py-1.5 text-sm">
                      <span className="mr-2 text-xs uppercase text-muted-foreground">{a.type}</span>
                      {[a.street, a.addressLine2, [a.zip, a.city].filter(Boolean).join(' '), a.countryCode].filter(Boolean).join(', ')}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {p.relations.length > 0 && (
              <Section title="Relationships">
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {p.relations.map((r) => (
                    <li key={r.relationshipId} className="flex items-center gap-3 px-3 py-1.5 text-sm">
                      <KindIcon kind={r.other.kind} className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <Link to={`/contacts/${r.other.id}`} className="truncate text-blue-600 hover:underline dark:text-blue-400">{r.other.displayName}</Link>
                      <span className="text-xs text-muted-foreground">{r.roleName}{r.roleNote ? ` · ${r.roleNote}` : ''}</span>
                      {r.verifiedAt && <span className="ml-auto text-xs text-green-700 dark:text-green-400">verified</span>}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {p.mailingLists.length > 0 && (
              <Section title="Distribution lists">
                <div className="flex flex-wrap gap-1.5">
                  {p.mailingLists.map((l) => (
                    <span key={l.id} className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs">{l.name}</span>
                  ))}
                </div>
              </Section>
            )}

            {p.website && (
              <Section title="Website">
                <a href={p.website.startsWith('http') ? p.website : `https://${p.website}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
                  {p.website} <ExternalLink className="h-3 w-3" />
                </a>
              </Section>
            )}

            {p.history.length > 0 && (
              <Section title="History">
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {p.history.map((h, i) => (
                    <li key={`${h.at}-${i}`} className="truncate" title={h.summary}>{h.summary}</li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
