import { useState, type ReactNode } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, CheckCircle2, ExternalLink } from 'lucide-react'
import { useParty, useUpdateParty, useMarkReviewed } from '../hooks/useParties'
import { reviewClass } from './partyBits'
import { KindIcon } from './KindIcon'
import { cn } from '../lib/utils'
import { formatDate } from '../lib/format'
import type { Party, PartyChannel, PartyRelation } from '../types/party'

function Field({ label, value }: { label: string; value: ReactNode }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="border-b border-border py-2">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  )
}

function Section({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {intro && <p className="mb-2 text-xs text-muted-foreground">{intro}</p>}
      {children}
    </section>
  )
}

/** The listbox look of the 4D tabs: a bordered table, header in small caps, one line per row. */
function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            {headers.map((h, i) => <th key={i} className="px-3 py-1.5 font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  )
}

const td = 'px-3 py-1.5 align-top'

function channelHref(c: PartyChannel): string | undefined {
  if (c.type === 'EMAIL') return `mailto:${c.value}`
  if (c.type === 'PHONE' || c.type === 'FAX') return `tel:${c.value.replace(/\s+/g, '')}`
  if (c.type === 'WEBSITE' || c.type === 'SOCIAL') return c.value.startsWith('http') ? c.value : `https://${c.value}`
  return undefined
}

/** Party.gender is the numeric code of the legacy personen radio group: Unknown/Male/Female/Diverse = 0/1/2/3. */
const GENDER_LABEL: Record<string, string> = { '0': '', '1': 'male', '2': 'female', '3': 'diverse' }

/** Status column of the Relationships tab: "expired" / "not yet" / nothing while the row is current. */
function validityLabel(r: PartyRelation): string {
  const today = new Date().toISOString().slice(0, 10)
  if (r.validTo && r.validTo.slice(0, 10) < today) return 'expired'
  if (r.validFrom && r.validFrom.slice(0, 10) > today) return 'not yet'
  return ''
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

/** The intro sentences of the 4D "Films & awards" and "History" tabs, word for word. */
function filmsIntro(n: number): string {
  if (n === 0) return 'No films linked to this entry.'
  return `${n === 1 ? '1 film' : `${n} films`}, newest first. Credits and company roles are maintained on the film, not here.`
}
function awardsIntro(n: number): string {
  if (n === 0) return 'No awards on this entry. An award a FILM won is shown on the film.'
  return `${n === 1 ? '1 award' : `${n} awards`} held by this entry, newest first.`
}
function historyIntro(n: number): string {
  if (n === 0) return 'Nothing recorded for this entry yet.'
  if (n === 1) return '1 recorded change.'
  return `${n} recorded changes, newest first.${n >= 30 ? ' Older ones are in the protocol, not in this list.' : ''}`
}

export function PartyDetailPage() {
  const { id } = useParams()
  const { data: p, isLoading, error } = useParty(id)
  const update = useUpdateParty(id)
  const review = useMarkReviewed(id)

  return (
    <div className="p-4 md:p-6">
      <Link to="/parties" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
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

            {/* the same fields as the 4D mask, with its kind-dependent layout */}
            <dl className="mt-4">
              {p.kind === 'person' && <Field label="Given name" value={p.vorname} />}
              {p.kind === 'person' && <Field label="Last name" value={p.nachname} />}
              {p.kind !== 'person' && <Field label="Name" value={p.displayName} />}
              {p.kind !== 'person' && <Field label="Short name" value={p.shortName} />}
              {p.kind === 'person' && <Field label="Title" value={p.academicTitle} />}
              {p.kind === 'person' && <Field label="Gender" value={GENDER_LABEL[p.gender] ?? p.gender} />}
              <Field label="Category" value={p.categoryName} />
              {p.kind === 'person' && <Field label="Born" value={[formatDate(p.bornDate), p.bornInYear, p.bornIn].filter(Boolean).join(' · ')} />}
              {p.kind === 'person' && <Field label="Died" value={[formatDate(p.diedDate), p.diedInYear, p.diedIn].filter(Boolean).join(' · ')} />}
              <Field label="Hidden on the public website" value={p.hidden ? 'yes' : ''} />
            </dl>

            <Section title="Note">
              {/* keyed by party AND stored note: a fresh editor per row and after every save, no effect needed */}
              <NoteEditor key={`${p.id}:${p.note}`} initial={p.note ?? ''} saving={update.isPending} onSave={(note) => update.mutate({ note })} />
            </Section>

            <Section title="Contact details" intro="E-mail, phone, fax, website and social are rows — a party may hold several of each. The preferred one per type is what every display reads.">
              {p.channels.length === 0 ? (
                <p className="text-sm text-muted-foreground">none</p>
              ) : (
                <Table headers={['Type', 'Value', 'Label', 'Preferred']}>
                  {p.channels.map((c) => {
                    const href = channelHref(c)
                    return (
                      <tr key={c.id}>
                        <td className={cn(td, 'text-xs uppercase text-muted-foreground')}>{c.type}</td>
                        <td className={td}>
                          {href ? <a href={href} target={c.type === 'WEBSITE' || c.type === 'SOCIAL' ? '_blank' : undefined} rel="noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">{c.value}</a> : c.value}
                        </td>
                        <td className={cn(td, 'text-muted-foreground')}>{c.label}</td>
                        <td className={cn(td, 'text-green-700 dark:text-green-400')}>{c.preferred ? '✓' : ''}</td>
                      </tr>
                    )
                  })}
                </Table>
              )}
            </Section>

            <Section title="Addresses" intro="The country code lives on the address and nowhere else. COUNTRY_ONLY is for a party whose country is known but whose address is not.">
              {p.addresses.length === 0 ? (
                <p className="text-sm text-muted-foreground">none</p>
              ) : (
                <Table headers={['Type', 'Street', 'ZIP', 'City', 'Country']}>
                  {p.addresses.map((a) => (
                    <tr key={a.id}>
                      <td className={cn(td, 'text-xs uppercase text-muted-foreground')}>{a.type}</td>
                      <td className={td}>{[a.street, a.addressLine2].filter(Boolean).join(', ')}</td>
                      <td className={td}>{a.zip}</td>
                      <td className={td}>{a.city}</td>
                      <td className={td}>{a.countryCode}</td>
                    </tr>
                  ))}
                </Table>
              )}
            </Section>

            <Section title="Relationships" intro="Both directions are listed — the arrow says how the row is stored, not who matters.">
              {p.relations.length === 0 ? (
                <p className="text-sm text-muted-foreground">none</p>
              ) : (
                <Table headers={['', 'Role', 'Other party', 'From', 'To', 'Status', 'Checked']}>
                  {p.relations.map((r) => {
                    const linkOnly = r.roleCode === 'RELATED_TO'
                    return (
                      <tr key={r.relationshipId}>
                        <td className={cn(td, 'text-muted-foreground')} title={r.outgoing ? 'stored on this entry' : 'stored on the other entry'}>{r.outgoing ? '→' : '←'}</td>
                        <td className={cn(td, linkOnly && 'italic text-muted-foreground')}>
                          {linkOnly ? '— link only' : r.roleName}{r.roleNote ? <span className="text-xs text-muted-foreground"> · {r.roleNote}</span> : null}
                        </td>
                        <td className={td}>
                          <Link to={`/parties/${r.other.id}`} className="inline-flex items-center gap-1.5 text-blue-600 hover:underline dark:text-blue-400">
                            <KindIcon kind={r.other.kind} className="h-4 w-4 shrink-0 text-muted-foreground" />
                            {r.other.displayName}
                          </Link>
                        </td>
                        <td className={cn(td, 'whitespace-nowrap')}>{formatDate(r.validFrom)}</td>
                        <td className={cn(td, 'whitespace-nowrap')}>{formatDate(r.validTo)}</td>
                        <td className={cn(td, 'text-xs text-amber-700 dark:text-amber-400')}>{validityLabel(r)}</td>
                        <td className={cn(td, 'text-green-700 dark:text-green-400')} title={r.verifiedAt ? `checked ${r.verifiedAt.slice(0, 10)}` : undefined}>{r.verifiedAt ? '✓' : ''}</td>
                      </tr>
                    )
                  })}
                </Table>
              )}
            </Section>

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

            <Section title="Films" intro={filmsIntro(p.films.length)}>
              {p.films.length > 0 && (
                <Table headers={['Year', 'Title', 'English title', 'Role', 'Country', 'Source']}>
                  {p.films.map((f) => (
                    <tr key={f.rowId}>
                      <td className={cn(td, 'whitespace-nowrap')}>{f.year || ''}</td>
                      <td className={td}>
                        {f.filmKey ? <Link to={`/films/${f.filmKey}`} className="text-blue-600 hover:underline dark:text-blue-400">{f.title}</Link> : f.title}
                      </td>
                      <td className={cn(td, 'text-muted-foreground')}>{f.titleEn}</td>
                      <td className={td}>{f.role}</td>
                      <td className={td}>{f.country}</td>
                      <td className={cn(td, 'text-xs text-muted-foreground')}>{f.source}</td>
                    </tr>
                  ))}
                </Table>
              )}
            </Section>

            <Section title="Awards" intro={awardsIntro(p.awards.length)}>
              {p.awards.length > 0 && (
                <Table headers={['Year', 'Award', 'Category', 'Festival', 'Result']}>
                  {p.awards.map((a, i) => (
                    <tr key={`${a.year}-${a.name}-${i}`}>
                      <td className={cn(td, 'whitespace-nowrap')}>{a.year || ''}</td>
                      <td className={td}>{a.name}</td>
                      <td className={td}>{a.category}</td>
                      <td className={td}>{a.festival}</td>
                      <td className={td}>{a.result.replace('_', ' ')}</td>
                    </tr>
                  ))}
                </Table>
              )}
            </Section>

            <Section title="History" intro={historyIntro(p.history.length)}>
              {p.history.length > 0 && (
                <Table headers={['When', 'User', 'Source', 'What', 'Detail']}>
                  {p.history.map((h, i) => (
                    <tr key={h.P_UUID || `${h.at}-${i}`} className="text-xs">
                      <td className={cn(td, 'whitespace-nowrap')}>{h.at.slice(0, 16).replace('T', ' ')}</td>
                      <td className={td}>{h.user}</td>
                      <td className={cn(td, 'text-muted-foreground')}>{h.source}</td>
                      <td className={td}>{h.action}</td>
                      <td className={cn(td, 'text-muted-foreground')}>{h.detail}</td>
                    </tr>
                  ))}
                </Table>
              )}
            </Section>
          </div>
        </div>
      )}
    </div>
  )
}
