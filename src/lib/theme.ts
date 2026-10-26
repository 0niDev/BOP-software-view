/**
 * Theme handling. Mirrors the desktop app's Dark / Light / System appearance
 * setting, stored under a local key and resolved into `data-theme` on <html>.
 * The DB's APPEARANCE.theme_name is used only as the initial default.
 */

export const THEMES = ['dark', 'light', 'system'] as const
export type ThemeMode = (typeof THEMES)[number]

const STORAGE_KEY = 'bop-view.theme'

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value)
}

export function readStoredTheme(): ThemeMode | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return isThemeMode(value) ? value : null
  } catch {
    return null
  }
}

export function writeStoredTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    /* storage may be unavailable in private mode */
  }
}

export function prefersLight(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: light)').matches
    : false
}

export function resolveTheme(mode: ThemeMode): 'dark' | 'light' {
  if (mode === 'light') return 'light'
  if (mode === 'system') return prefersLight() ? 'light' : 'dark'
  return 'dark'
}

export function applyTheme(mode: ThemeMode): void {
  if (typeof document === 'undefined') return
  const resolved = resolveTheme(mode)
  document.documentElement.dataset.theme = resolved
  document.documentElement.dataset.themeSource = mode
  document.documentElement.style.colorScheme = resolved
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

export function nextTheme(mode: ThemeMode): ThemeMode {
  return mode === 'dark' ? 'light' : mode === 'light' ? 'system' : 'dark'
}
