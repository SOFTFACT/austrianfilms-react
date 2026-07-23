// Theme state + helpers (kept separate from the provider component so Fast
// Refresh stays happy: this file exports no components).
import { createContext } from 'react'

export type Theme = 'light' | 'dark'

const THEME_KEY = 'austrianfilms-theme'

function storedTheme(): Theme | null {
  const t = localStorage.getItem(THEME_KEY)
  return t === 'dark' || t === 'light' ? t : null
}

// Saved preference wins; otherwise fall back to the OS colour scheme. Matches
// the inline boot script in index.html, so React state and the <html> class
// agree from the first render.
export function getInitialTheme(): Theme {
  return storedTheme() ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem(THEME_KEY, theme)
}

export interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
