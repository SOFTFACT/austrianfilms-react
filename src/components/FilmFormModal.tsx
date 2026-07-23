import { X, Loader2, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useFilmForm, type FilmFormState } from '../hooks/useFilmForm'
import { FILM_GENRES, type Film } from '../types/film'
import { cn } from '../lib/utils'

/** Text/number field row used throughout the form. */
function FieldInput({
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border px-2 py-2 text-sm outline-none focus:border-ring"
      />
    </div>
  )
}

/**
 * Create/edit a film in a modal. Pass `film` to edit (PUT), omit to create
 * (POST). The list's "New film" button uses the create form; in-place editing
 * of an existing film happens on FilmDetailPage (edit mode), not here.
 */
export function FilmFormModal({ film, onClose }: { film?: Film; onClose: () => void }) {
  const { form, set, submit, saving, error } = useFilmForm(film, onClose)
  const [showDetails, setShowDetails] = useState(false)
  const isEdit = !!film
  const f = (k: keyof FilmFormState) => (v: string) => set(k, v)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="mt-10 w-full max-w-2xl rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-base font-semibold text-foreground">{isEdit ? 'Edit film' : 'New film'}</h2>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <FieldInput label="Title" value={form.titel} onChange={f('titel')} required placeholder="Film title" />
          <FieldInput
            label="English title"
            value={form.englischerTitel}
            onChange={f('englischerTitel')}
            placeholder="English title"
          />
          <div className="grid grid-cols-2 gap-3">
            <FieldInput
              label="Production year"
              value={form.produktionsjahr}
              onChange={f('produktionsjahr')}
              type="number"
              required
              placeholder="2024"
            />
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Genre</label>
              <select
                value={form.genre}
                onChange={(e) => set('genre', e.target.value)}
                className="w-full rounded-lg border border-border px-2 py-2 text-sm"
              >
                <option value="">—</option>
                {FILM_GENRES.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <FieldInput label="Director" value={form.regie} onChange={f('regie')} placeholder="Director name" />
            <FieldInput
              label="Production company"
              value={form.produktion}
              onChange={f('produktion')}
              placeholder="Production company"
            />
          </div>

          {/* Additional details (collapsible) */}
          <button
            type="button"
            onClick={() => setShowDetails((s) => !s)}
            className="flex w-full items-center justify-between border-t border-border pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
          >
            <span>Additional details</span>
            <ChevronDown className={cn('h-4 w-4 transition-transform', showDetails && 'rotate-180')} />
          </button>
          {showDetails && (
            <div className="grid grid-cols-2 gap-3">
              <FieldInput label="Category" value={form.kategorie} onChange={f('kategorie')} placeholder="e.g. Feature, Short" />
              <FieldInput label="Film genre" value={form.filmgenre} onChange={f('filmgenre')} placeholder="e.g. Drama" />
              <FieldInput label="AFC contact" value={form.betreuung} onChange={f('betreuung')} />
              <FieldInput label="Duration (min)" value={form.minuten} onChange={f('minuten')} type="number" placeholder="90" />
              <FieldInput label="Format" value={form.format} onChange={f('format')} placeholder="e.g. DCP, 35mm" />
              <FieldInput label="Original language" value={form.originalsprache} onChange={f('originalsprache')} />
              <FieldInput label="World sales" value={form.weltvertrieb} onChange={f('weltvertrieb')} />
              <FieldInput
                label="Film website"
                value={form.filmwebsite}
                onChange={f('filmwebsite')}
                type="url"
                placeholder="https://example.com"
              />
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes</label>
                <textarea
                  value={form.bemerkung}
                  onChange={(e) => set('bemerkung', e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border px-2 py-2 text-sm outline-none focus:border-ring"
                />
              </div>
            </div>
          )}

          {error && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
