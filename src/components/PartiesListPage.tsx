import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Loader2, LayoutGrid, List as ListIcon } from 'lucide-react'
import { VirtualList, VirtualGrid } from './virtual'
import { usePartiesInfinite } from '../hooks/useParties'
import { useDebounce } from '../hooks/useDebounce'
import { fetchAllPages } from '../lib/fetchAllPages'
import { type ExportColumn } from '../lib/exportTable'
import { getParties } from '../api/parties'
import { cn } from '../lib/utils'
import { ExportMenu } from './ExportMenu'
import { PARTY_WORKSETS, type PartyFilters, type PartyKind, type PartyRow } from '../types/party'
import { KIND_LABEL, reviewClass } from './partyBits'
import { KindIcon } from './KindIcon'

type ViewMode = 'cards' | 'list'

/** CSV export columns for the party list. */
const EXPORT_COLUMNS: ExportColumn<PartyRow>[] = [
  { header: 'Name', value: (p) => p.displayName },
  { header: 'Kind', value: (p) => p.kind },
  { header: 'First name', value: (p) => p.vorname },
  { header: 'Last name', value: (p) => p.nachname },
  { header: 'Short name', value: (p) => p.shortName },
  { header: 'City', value: (p) => p.city },
  { header: 'E-mail', value: (p) => p.email },
  { header: 'Source', value: (p) => p.source },
  { header: 'Checked', value: (p) => (p.reviewState === 'checked' ? p.reviewedAt.slice(0, 10) : '') },
  { header: 'Links', value: (p) => p.linkCount },
]

function Avatar({ p, size }: { p: PartyRow; size: string }) {
  if (p.imageUrl) {
    return <img src={p.imageUrl} alt={p.displayName} loading="lazy" className={`${size} rounded-full object-cover`} />
  }
  return (
    <div className={`${size} flex items-center justify-center rounded-full bg-accent text-muted-foreground`}>
      <KindIcon kind={p.kind} className="h-1/2 w-1/2" />
    </div>
  )
}

function PartyCard({ p, onClick }: { p: PartyRow; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-full w-full flex-col items-center gap-2 rounded-lg border border-border bg-card p-3 text-center transition-shadow hover:shadow-md"
    >
      <Avatar p={p} size="h-20 w-20" />
      <div className="min-w-0">
        <div className={cn('truncate text-sm font-medium text-foreground', reviewClass(p.reviewState))}>{p.displayName || '—'}</div>
        <div className="truncate text-xs text-muted-foreground">{p.city || KIND_LABEL[p.kind]}</div>
      </div>
    </button>
  )
}

export function PartiesListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [kind, setKind] = useState<PartyKind | ''>('')
  const [workset, setWorkset] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const apiFilters: PartyFilters = {
    search: debouncedSearch || undefined,
    kind: kind || undefined,
    workset: workset || undefined,
    sortField: 'displayName',
    sortOrder: 'asc',
  }

  const { items, total, isLoading, error, hasNextPage, isFetchingNextPage, fetchNextPage } =
    usePartiesInfinite(apiFilters)

  const selectClass = 'rounded-lg border border-border bg-card px-2 py-2 text-sm outline-none focus:border-ring'

  return (
    <div className="flex flex-col">
      <div className="sticky top-12 z-10 border-b border-border bg-muted/95 px-4 py-3 backdrop-blur md:top-0 md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold text-foreground">Contacts</h1>
          <span className="text-sm text-muted-foreground">{total.toLocaleString()} total</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-1 py-1" aria-label="View">
              <button type="button" onClick={() => setViewMode('cards')} title="Card view" aria-pressed={viewMode === 'cards'} className={cn('rounded p-1.5', viewMode === 'cards' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent')}>
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setViewMode('list')} title="List view" aria-pressed={viewMode === 'list'} className={cn('rounded p-1.5', viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent')}>
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
            <select value={kind} onChange={(e) => setKind(e.target.value as PartyKind | '')} className={selectClass} aria-label="Kind">
              <option value="">All kinds</option>
              <option value="person">Persons</option>
              <option value="organization">Organizations</option>
              <option value="group">Groups</option>
            </select>
            <select value={workset} onChange={(e) => setWorkset(e.target.value)} className={cn(selectClass, 'max-w-56')} aria-label="Work list">
              {PARTY_WORKSETS.map((w) => (
                <option key={w.code} value={w.code}>{w.code ? w.label : 'Work list: all'}</option>
              ))}
            </select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name…"
                className="w-40 rounded-lg border border-border py-2 pl-8 pr-3 text-sm outline-none focus:border-ring md:w-56"
              />
            </div>
            <ExportMenu<PartyRow>
              filenameBase="contacts"
              columns={EXPORT_COLUMNS}
              loadRows={(onProgress) =>
                fetchAllPages<PartyRow>(
                  (offset, limit) => getParties({ ...apiFilters, offset, limit }),
                  { onProgress: (n) => onProgress(n) },
                ).then(({ rows, truncated }) => ({ rows, truncated }))
              }
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-3 md:px-6">
        {isLoading ? (
          <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : error ? (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {(error as { title?: string })?.title ?? 'Failed to load contacts.'}
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No entries found.</div>
        ) : viewMode === 'cards' ? (
          <VirtualGrid<PartyRow>
            items={items}
            estimateRowSize={180}
            cardMinWidth={150}
            cardGap={16}
            rowClassName="pb-4"
            getItemKey={(p) => p.id}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            renderItem={(p) => <PartyCard p={p} onClick={() => navigate(`/contacts/${p.id}`)} />}
          />
        ) : (
          <VirtualList<PartyRow>
            items={items}
            estimateSize={56}
            getItemKey={(p) => p.id}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            renderItem={(p) => (
              <button
                onClick={() => navigate(`/contacts/${p.id}`)}
                className="flex h-14 w-full items-center gap-3 border-b border-border bg-card px-3 text-left hover:bg-muted"
              >
                <Avatar p={p} size="h-9 w-9" />
                <div className="min-w-0 flex-1">
                  <div className={cn('truncate text-sm font-medium text-foreground', reviewClass(p.reviewState))}>{p.displayName || '—'}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {KIND_LABEL[p.kind]}{p.email ? ` · ${p.email}` : ''}
                  </div>
                </div>
                <div className="hidden w-40 shrink-0 truncate text-right text-xs text-muted-foreground md:block">{p.city}</div>
                <div className="hidden w-36 shrink-0 truncate text-right text-xs text-muted-foreground lg:block" title="Source">{p.source}</div>
                <div className="hidden w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground sm:block" title="Links">{p.linkCount}</div>
              </button>
            )}
          />
        )}
      </div>
    </div>
  )
}
