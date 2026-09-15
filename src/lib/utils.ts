import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Whether a list page puts the cursor into its search field on arrival, so
 * the editor can type straight away. Only with a mouse or trackpad: on touch
 * devices (iPad, phone) a focused input opens the on-screen keyboard over the
 * list on every section change. Read once at mount, as autoFocus is.
 */
export function canAutoFocusSearch(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches
}
