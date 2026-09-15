import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Plus, Search, X } from 'lucide-react'
import type { ApiError } from '@softfact/api4d-react'
import { getParties } from '../api/parties'
import { useDebounce } from '../hooks/useDebounce'
import {
  useAddFilmCompany,
  useAddFilmCredit,
  useCompanyRoles,
  useCreditRoles,
  useFilmCredits,
  useRemoveFilmCompany,
  useRemoveFilmCredit,
} from '../hooks/useFilmPeople'
import type { Film, FilmCompany, FilmCredit } from '../types/film'
import type { PartyKind, PartyRow } from '../types/party'
import { KindIcon } from './KindIcon'
import { Flag } from './Flag'

/*
 * People and companies on a film, on the Party model (2026-09-15).
 *
 * Credits (person_film_rel) and company roles (film_contact_rel) are links to
 * contacts, not text: each name opens the contact, and adding one means
 * picking an existing contact and a role. Writes save immediately — they are
 * separate rows, not fields of the film form, so they do not wait for "Save".
 */

function errorText(err: unknown, fallback: string): string {
  const e = err as ApiError
  return e?.problem?.detail || e?.problem?.title || fallback
}

function Card({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <div className="mt-4 rounded-lg border border-border bg-card p-4">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      {intro && <p className="mb-2 text-xs text-muted-foreground">{intro}</p>}
      {children}
    </div>
  )
}

/** A contact name linking to the contact page. */
function PartyLink({ id, name, kind }: { id: string; name: string; kind?: PartyKind }) {
  if (!name) return <span className="italic text-muted-foreground">(contact not found)</span>
  return (
    <Link to={`/parties/${id}`} className="inline-flex items-center gap-1.5 text-blue-600 hover:underline dark:text-blue-400">
      {kind && <KindIcon kind={kind} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
      {name}
    </Link>
  )
}

/** Remove button with an inline second step instead of a browser dialog. */
function RemoveButton({ label, busy, onConfirm }: { label: string; busy: boolean; onConfirm: () => void }) {
  const [asking, setAsking] = useState(false)
  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        title={`Remove ${label}`}
        aria-label={`Remove ${label}`}
        className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <button
        type="button"
        onClick={onConfirm}
        disabled={busy}
        className="rounded bg-destructive px-1.5 py-0.5 font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Remove'}
      </button>
      <button type="button" onClick={() => setAsking(false)} className="rounded px-1.5 py-0.5 hover:bg-muted">
        Cancel
      </button>
    </span>
  )
}

/**
 * Search-and-pick for an existing contact. `kinds` narrows the search:
 * credits take persons and groups (a duo is credited as one), companies take
 * organizations. One request per kind, so a name search is not crowded out by
 * the other kind.
 */
function PartyPicker({
  kinds,
  placeholder,
  picked,
  onPick,
}: {
  kinds: PartyKind[]
  placeholder: string
  picked: PartyRow | null
  onPick: (p: PartyRow | null) => void
}) {
  const [q, setQ] = useState('')
  const dq = useDebounce(q.trim(), 300)
  const { data: results = [], isFetching } = useQuery({
    queryKey: ['party-pick', kinds.join(','), dq],
    queryFn: async () => {
      const pages = await Promise.all(kinds.map((kind) => getParties({ search: dq, kind, limit: 10 })))
      return pages.flatMap((p) => p.data)
    },
    enabled: dq.length >= 2 && !picked,
  })

  if (picked) {
    return (
      <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg border border-border bg-muted px-2 py-1.5 text-sm">
        <KindIcon kind={picked.kind} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{picked.displayName}</span>
        <button type="button" onClick={() => onPick(null)} aria-label="Clear contact" className="rounded p-0.5 hover:bg-accent">
          <X className="h-3.5 w-3.5" />
        </button>
      </span>
    )
  }

  return (
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-lg border border-border bg-card py-2 pl-8 pr-8 text-sm outline-none focus:border-ring"
      />
      {isFetching && <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
      {dq.length >= 2 && !isFetching && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
          {results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">No contact found.</div>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onPick(p)
                  setQ('')
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <KindIcon kind={p.kind} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{p.displayName}</span>
                {p.city && <span className="ml-auto shrink-0 text-xs text-muted-foreground">{p.city}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

const selectClass = 'rounded-lg border border-border bg-card px-2 py-2 text-sm'
const addButtonClass =
  'flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50'

/**
 * Credits grouped by role, in the order of the role catalogue. `editable`
 * (the page's edit mode) adds the remove buttons and the add row; the read
 * view shows the linked names only.
 */
export function FilmCreditsSection({ filmId, editable }: { filmId: string; editable: boolean }) {
  const { data: credits = [], isLoading, error: loadError } = useFilmCredits(filmId)
  const { data: roles = [] } = useCreditRoles()
  const add = useAddFilmCredit(filmId)
  const remove = useRemoveFilmCredit(filmId)
  const [party, setParty] = useState<PartyRow | null>(null)
  const [roleId, setRoleId] = useState('')
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)

  const groups = useMemo(() => {
    const order = new Map(roles.map((r, i) => [r.name, i]))
    const byRole = new Map<string, FilmCredit[]>()
    for (const c of credits) {
      const key = c.role || '(no role)'
      byRole.set(key, [...(byRole.get(key) ?? []), c])
    }
    return [...byRole.entries()].sort((a, b) => (order.get(a[0]) ?? 999) - (order.get(b[0]) ?? 999))
  }, [credits, roles])

  async function submit() {
    if (!party || !roleId) return
    setMessage(null)
    try {
      const res = await add.mutateAsync({ partyId: party.id, roleId })
      const roleName = roles.find((r) => r.id === roleId)?.name ?? ''
      setMessage(
        res.alreadyThere
          ? { text: `${party.displayName} is already credited as ${roleName}.`, error: false }
          : { text: `${party.displayName} added as ${roleName}.`, error: false },
      )
      // The role stays selected: cast and crew are usually entered several in a row.
      setParty(null)
    } catch (err) {
      setMessage({ text: errorText(err, 'Could not add the credit.'), error: true })
    }
  }

  return (
    <Card title="Credits" intro="People and collectives credited on the film, linked to their contact.">
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : loadError ? (
        // An empty list here would read as "this film has no credits" — say it failed instead.
        <p className="text-sm text-destructive">{errorText(loadError, 'The credits could not be loaded.')}</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No credits yet.</p>
      ) : (
        <dl>
          {groups.map(([role, list]) => (
            <div key={role} className="border-b border-border py-2 last:border-b-0">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">{role}</dt>
              <dd className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {list.map((c) => (
                  <span key={c.creditId} className="inline-flex items-center gap-1">
                    <PartyLink id={c.partyId} name={c.name} kind={c.kind} />
                    {editable && <RemoveButton
                      label={`${c.name} as ${role}`}
                      busy={remove.isPending && remove.variables === c.creditId}
                      onConfirm={() =>
                        remove.mutate(c.creditId, {
                          onSuccess: () => setMessage({ text: `${c.name} removed from ${role}.`, error: false }),
                          onError: (err) => setMessage({ text: errorText(err, 'Could not remove the credit.'), error: true }),
                        })
                      }
                    />}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {editable && <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <PartyPicker kinds={['person', 'group']} placeholder="Search person or group…" picked={party} onPick={setParty} />
        <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className={selectClass} aria-label="Credit role">
          <option value="">Role…</option>
          {roles
            .filter((r) => r.selectable)
            .map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
        </select>
        <button type="button" onClick={submit} disabled={!party || !roleId || add.isPending} className={addButtonClass}>
          {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add credit
        </button>
      </div>}
      {editable && message && (
        <p className={message.error ? 'mt-2 text-sm text-destructive' : 'mt-2 text-sm text-muted-foreground'}>{message.text}</p>
      )}
    </Card>
  )
}

/** Companies grouped by role (Austrian producer, co-producer, world sales, distributor); `editable` as for credits. */
export function FilmCompaniesSection({ film, editable }: { film: Film; editable: boolean }) {
  const { data: roles = [] } = useCompanyRoles()
  const add = useAddFilmCompany(film.id)
  const remove = useRemoveFilmCompany(film.id)
  const [party, setParty] = useState<PartyRow | null>(null)
  const [roleId, setRoleId] = useState('')
  const [territory, setTerritory] = useState('AT')
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)

  const role = roles.find((r) => r.id === roleId)
  const groups = useMemo(() => {
    const byRole = new Map<string, FilmCompany[]>()
    for (const c of film.productionCompanies ?? []) {
      const key = c.roleName || '(unknown role)'
      byRole.set(key, [...(byRole.get(key) ?? []), c])
    }
    return [...byRole.entries()] // the API already sorts by role order, then name
  }, [film.productionCompanies])

  const territoryOk = !role?.territoryRequired || /^[A-Za-z]{2}$/.test(territory.trim())

  async function submit() {
    if (!party || !role || !territoryOk) return
    setMessage(null)
    try {
      await add.mutateAsync({
        partyId: party.id,
        roleId: role.id,
        countryCode: role.territoryRequired ? territory.trim().toUpperCase() : undefined,
      })
      setMessage({ text: `${party.displayName} linked as ${role.name}.`, error: false })
      setParty(null)
    } catch (err) {
      setMessage({ text: errorText(err, 'Could not link the company.'), error: true })
    }
  }

  return (
    <Card title="Companies" intro="Production, world sales and distribution, linked to the company contact.">
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No companies linked yet.</p>
      ) : (
        <dl>
          {groups.map(([roleName, list]) => (
            <div key={roleName} className="border-b border-border py-2 last:border-b-0">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">{roleName}</dt>
              <dd className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {list.map((c) => (
                  <span key={c.relId} className="inline-flex items-center gap-1">
                    <PartyLink id={c.partyId} name={c.name} kind="organization" />
                    {c.countryCode && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title="Territory">
                        <Flag code={c.countryCode} className="h-3 w-4" />
                        {c.countryCode}
                      </span>
                    )}
                    {editable && <RemoveButton
                      label={`${c.name} as ${roleName}`}
                      busy={remove.isPending && remove.variables === c.relId}
                      onConfirm={() =>
                        remove.mutate(c.relId, {
                          onSuccess: () => setMessage({ text: `${c.name} removed from ${roleName}.`, error: false }),
                          onError: (err) => setMessage({ text: errorText(err, 'Could not remove the link.'), error: true }),
                        })
                      }
                    />}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {editable && <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <PartyPicker kinds={['organization']} placeholder="Search company…" picked={party} onPick={setParty} />
        <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className={selectClass} aria-label="Company role">
          <option value="">Role…</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        {role?.territoryRequired && (
          <input
            value={territory}
            onChange={(e) => setTerritory(e.target.value.toUpperCase())}
            maxLength={2}
            aria-label="Territory (country code)"
            title="Territory (2-letter country code)"
            className="w-14 rounded-lg border border-border bg-card px-2 py-2 text-center text-sm uppercase outline-none focus:border-ring"
          />
        )}
        <button type="button" onClick={submit} disabled={!party || !role || !territoryOk || add.isPending} className={addButtonClass}>
          {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Link company
        </button>
      </div>}
      {editable && message && (
        <p className={message.error ? 'mt-2 text-sm text-destructive' : 'mt-2 text-sm text-muted-foreground'}>{message.text}</p>
      )}
    </Card>
  )
}

/**
 * The legacy free texts (JART import), read-only. Shown so a gap between the
 * text and the links stays visible — e.g. a director in the text but no
 * director credit. Hidden when all three are empty.
 */
export function FilmLegacyPeople({ film }: { film: Film }) {
  const rows = [
    { label: 'Director', value: film.regieLegacy },
    { label: 'Production', value: film.produktion },
    { label: 'World sales', value: film.weltvertrieb },
  ].filter((r) => r.value)
  if (rows.length === 0) return null
  return (
    <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/40 p-4">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Legacy data (JART)</div>
      <p className="mb-2 text-xs text-muted-foreground">Free text from the old import — read-only. Credits and companies above are what counts.</p>
      <dl>
        {rows.map((r) => (
          <div key={r.label} className="py-1">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">{r.label}</dt>
            <dd className="text-sm text-muted-foreground">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
