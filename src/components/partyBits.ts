import type { PartyKind, ReviewState } from '../types/party'

/** Shared between the contacts list and detail — no components in here, so fast refresh stays intact. */

export const KIND_LABEL: Record<PartyKind, string> = { person: 'Person', organization: 'Organization', group: 'Group' }

/** Green when checked, amber when changed since the check -- the 4D mask's colours. */
export function reviewClass(state: ReviewState): string {
  if (state === 'checked') return 'text-green-700 dark:text-green-400'
  if (state === 'changed') return 'text-amber-700 dark:text-amber-400'
  return ''
}
