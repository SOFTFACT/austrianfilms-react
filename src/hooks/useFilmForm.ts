import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createFilm, updateFilm, type FilmWriteBody } from '../api/films'
import type { Film } from '../types/film'
import type { ApiError } from '../api/client'

/** All writable film fields as form strings (number fields kept as text). */
export interface FilmFormState {
  titel: string
  englischerTitel: string
  produktionsjahr: string
  genre: string
  regie: string
  produktion: string
  kategorie: string
  filmgenre: string
  betreuung: string
  minuten: string
  format: string
  originalsprache: string
  weltvertrieb: string
  filmwebsite: string
  bemerkung: string
}

function initState(film?: Film): FilmFormState {
  return {
    titel: film?.titel ?? '',
    englischerTitel: film?.englischerTitel ?? '',
    produktionsjahr: film?.produktionsjahr ? String(film.produktionsjahr) : '',
    genre: film?.genre ? String(film.genre) : '',
    regie: film?.regie ?? '',
    produktion: film?.produktion ?? '',
    kategorie: film?.kategorie ?? '',
    filmgenre: film?.filmgenre ?? '',
    betreuung: film?.betreuung ?? '',
    minuten: film?.minuten ? String(film.minuten) : '',
    format: film?.format ?? '',
    originalsprache: film?.originalsprache ?? '',
    weltvertrieb: film?.weltvertrieb ?? '',
    filmwebsite: film?.filmwebsite ?? '',
    bemerkung: film?.bemerkung ?? '',
  }
}

/**
 * Shared create/edit logic for a film. Pass `film` to edit (PUT), omit to
 * create (POST). `onSaved` fires after a successful write + cache invalidation
 * (e.g. close the modal / leave edit mode). Initial state is captured once on
 * mount — render the consumer only when `film` is loaded so the fields fill in
 * (mount/unmount rather than effect-based reset).
 */
export function useFilmForm(film: Film | undefined, onSaved: () => void) {
  const qc = useQueryClient()
  const [form, setForm] = useState<FilmFormState>(() => initState(film))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof FilmFormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit() {
    if (!form.titel.trim()) {
      setError('Title is required.')
      return
    }
    const year = Number(form.produktionsjahr)
    if (!form.produktionsjahr || Number.isNaN(year) || year < 1900 || year > 2100) {
      setError('Production year is required and must be between 1900 and 2100.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      const body: FilmWriteBody = {
        titel: form.titel.trim(),
        produktionsjahr: year,
        englischerTitel: form.englischerTitel || undefined,
        genre: form.genre ? Number(form.genre) : undefined,
        regie: form.regie || undefined,
        produktion: form.produktion || undefined,
        kategorie: form.kategorie || undefined,
        filmgenre: form.filmgenre || undefined,
        betreuung: form.betreuung || undefined,
        minuten: form.minuten || undefined,
        format: form.format || undefined,
        originalsprache: form.originalsprache || undefined,
        weltvertrieb: form.weltvertrieb || undefined,
        filmwebsite: form.filmwebsite || undefined,
        bemerkung: form.bemerkung || undefined,
      }
      if (film) {
        await updateFilm(film.id, body)
        await qc.invalidateQueries({ queryKey: ['film', film.id] })
      } else {
        await createFilm(body)
      }
      await qc.invalidateQueries({ queryKey: ['films'] })
      onSaved()
    } catch (err) {
      setError((err as ApiError).detail || (err as ApiError).title || 'Failed to save film.')
    } finally {
      setSaving(false)
    }
  }

  return { form, set, submit, saving, error }
}
