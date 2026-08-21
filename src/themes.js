// The palettes themselves live in index.css as `[data-theme='<id>']` blocks.
// This registry only holds what JavaScript actually needs: the picker's labels
// and the browser chrome colour, which has to be applied before the stylesheet
// is available. Adding a theme means adding a block there and an entry here.
export const THEME_STORAGE_KEY = 'cached-cards-theme'

export const SYSTEM_THEME = 'system'

export const DEFAULT_DARK = 'dark'
export const DEFAULT_LIGHT = 'light'

export const THEMES = [
  { id: 'dark', label: 'Cached Dark', mode: 'dark', themeColor: '#0b0d12' },
  { id: 'dracula', label: 'Dracula', mode: 'dark', themeColor: '#282a36' },
  { id: 'nord', label: 'Nord', mode: 'dark', themeColor: '#2e3440' },
  { id: 'light', label: 'Cached Light', mode: 'light', themeColor: '#f6f1e7' },
  { id: 'alucard', label: 'Alucard', mode: 'light', themeColor: '#fffbeb' },
  {
    id: 'solarized-light',
    label: 'Solarized Light',
    mode: 'light',
    themeColor: '#fdf6e3',
  },
]

export const MODE_LABELS = { dark: 'Dark', light: 'Light' }

const byId = new Map(THEMES.map((theme) => [theme.id, theme]))

export const themeColors = () =>
  Object.fromEntries(THEMES.map((theme) => [theme.id, theme.themeColor]))

export const isThemeId = (value) => byId.has(value)

// A stored value is either a theme id or 'system'. Anything else - a theme
// that has since been removed, a hand-edited value - follows the OS instead.
export const normalizePreference = (value) =>
  isThemeId(value) ? value : SYSTEM_THEME

export const resolveTheme = (preference, prefersLight) =>
  preference === SYSTEM_THEME
    ? prefersLight
      ? DEFAULT_LIGHT
      : DEFAULT_DARK
    : preference

export const themeLabel = (id) => byId.get(id)?.label ?? id

export const themeColorFor = (id) =>
  byId.get(id)?.themeColor ?? byId.get(DEFAULT_DARK).themeColor

export const themesByMode = (mode) =>
  THEMES.filter((theme) => theme.mode === mode)
