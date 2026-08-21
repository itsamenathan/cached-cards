import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DARK,
  DEFAULT_LIGHT,
  SYSTEM_THEME,
  THEMES,
  normalizePreference,
  resolveTheme,
  themeColorFor,
} from './themes.js'

// Vitest hands back an empty string for `?raw` CSS imports, so the palettes
// are read off disk instead.
const css = fs.readFileSync(
  path.join(process.cwd(), 'src', 'index.css'),
  'utf8',
)

// Every palette is one flat `[data-theme='id'] { ... }` block, so a brace-free
// body match is enough to pull the variables back out.
const varsFor = (id) => {
  const block = css.match(
    new RegExp(`\\[data-theme='${id}'\\]\\s*\\{([^}]*)\\}`),
  )
  if (!block) throw new Error(`no CSS block for theme "${id}"`)
  return Object.fromEntries(
    [...block[1].matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [
      name,
      value.trim(),
    ]),
  )
}

const parseColor = (value) => {
  const rgba = value.match(
    /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\s*\)/,
  )
  if (rgba) {
    return [Number(rgba[1]), Number(rgba[2]), Number(rgba[3]), Number(rgba[4] ?? 1)]
  }
  const hex = value.replace('#', '')
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((char) => char + char)
          .join('')
      : hex
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)).concat(1)
}

const flatten = ([r, g, b, a], onto) =>
  a === 1
    ? [r, g, b, 1]
    : [r, g, b].map((channel, i) => channel * a + onto[i] * (1 - a)).concat(1)

const luminance = ([r, g, b]) =>
  [r, g, b]
    .map((channel) => {
      const c = channel / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0)

const contrast = (fg, bg) => {
  const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x)
  return (a + 0.05) / (b + 0.05)
}

describe('theme preferences', () => {
  it('keeps a known theme id and falls back to system for anything else', () => {
    expect(normalizePreference('dracula')).toBe('dracula')
    expect(normalizePreference(SYSTEM_THEME)).toBe(SYSTEM_THEME)
    expect(normalizePreference(null)).toBe(SYSTEM_THEME)
    expect(normalizePreference('a-theme-we-removed')).toBe(SYSTEM_THEME)
  })

  it('resolves system against the OS and leaves explicit themes alone', () => {
    expect(resolveTheme(SYSTEM_THEME, true)).toBe(DEFAULT_LIGHT)
    expect(resolveTheme(SYSTEM_THEME, false)).toBe(DEFAULT_DARK)
    expect(resolveTheme('alucard', false)).toBe('alucard')
    expect(resolveTheme('nord', true)).toBe('nord')
  })
})

describe('theme palettes', () => {
  it('gives every registered theme a CSS block and a chrome colour', () => {
    for (const theme of THEMES) {
      expect(varsFor(theme.id)['--bg']).toBe(theme.themeColor)
      expect(themeColorFor(theme.id)).toBe(theme.themeColor)
    }
  })

  // The rules get read in dim rooms on phones, so a new palette that looks
  // pretty in an editor but washes out in use should fail here first.
  it.each(THEMES.map((theme) => [theme.id]))(
    'keeps %s readable',
    (id) => {
      const vars = varsFor(id)
      const bg = parseColor(vars['--bg'])

      expect(contrast(parseColor(vars['--text']), bg)).toBeGreaterThanOrEqual(7)

      for (const name of ['--text-muted', '--text-soft', '--text-subtle']) {
        expect(contrast(parseColor(vars[name]), bg)).toBeGreaterThanOrEqual(4.5)
      }

      // Accent text always sits on the accent tint - active chips, difficulty
      // pills - never on the bare background.
      const tint = flatten(parseColor(vars['--accent-soft']), bg)
      expect(
        contrast(parseColor(vars['--accent-strong']), tint),
      ).toBeGreaterThanOrEqual(4.5)

      // Accent fills are large pill buttons. 3.5 is where the original light
      // palette already sat; everything added since clears 5.
      expect(
        contrast(parseColor(vars['--on-accent']), parseColor(vars['--accent'])),
      ).toBeGreaterThanOrEqual(3.5)
    },
  )
})
