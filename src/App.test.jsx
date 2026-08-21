import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from './App.jsx'
import { THEMES, THEME_STORAGE_KEY } from './themes.js'

function renderApp(entry) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/rules/:slug" element={<App />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('App routing and persistence', () => {
  it('shows onboarding on the library route', () => {
    renderApp('/')

    expect(screen.getByText('Welcome to Cached Cards')).toBeInTheDocument()
  })

  it('shows a not-found state when the slug does not match any rule', () => {
    renderApp('/rules/not-a-real-rule')

    expect(screen.queryByText('Welcome to Cached Cards')).not.toBeInTheDocument()
    expect(screen.getByText("We don't have that game")).toBeInTheDocument()
    expect(document.querySelector('.rule-card.active')).toBeNull()
  })

  it('keeps the routed rule on screen when a search excludes it', async () => {
    const user = userEvent.setup()
    renderApp('/rules/cribbage')

    expect(document.querySelector('.detail-header h1')?.textContent).toBe(
      'Cribbage',
    )

    await user.type(screen.getByPlaceholderText(/search games/i), 'war')

    expect(document.querySelector('.detail-header h1')?.textContent).toBe(
      'Cribbage',
    )
  })

  it('searches descriptions and tags, not just titles', async () => {
    const user = userEvent.setup()
    renderApp('/')

    await user.type(screen.getByPlaceholderText(/search games/i), 'poker')

    const titles = [...document.querySelectorAll('.rule-card-title')].map(
      (node) => node.textContent,
    )
    expect(titles).toContain("Texas Hold'em")
  })

  it('makes the game title the only h1 on a rule page', () => {
    renderApp('/rules/blackjack')

    const h1s = [...document.querySelectorAll('h1')].map((n) => n.textContent)
    expect(h1s).toEqual(['Blackjack'])
  })

  it('makes the wordmark the h1 on the library route', () => {
    renderApp('/')

    const h1s = [...document.querySelectorAll('h1')].map((n) => n.textContent)
    expect(h1s).toEqual(['Cached Cards'])
  })

  it('renders the rule body without repeating the title heading', () => {
    renderApp('/rules/blackjack')

    expect(document.querySelector('.markdown h1')).toBeNull()
  })

  it('persists the active rule to recent history', async () => {
    renderApp('/rules/blackjack')

    await waitFor(() => {
      const stored = JSON.parse(
        window.localStorage.getItem('cached-cards-recent') || '[]',
      )
      expect(stored[0]).toBe('blackjack')
    })
  })
})

describe('theme picker', () => {
  const openPicker = async (user) => {
    await user.click(screen.getByRole('button', { name: /^Theme:/ }))
    return screen.getByRole('menu', { name: 'Theme' })
  }

  it('applies and stores a theme chosen from the picker', async () => {
    const user = userEvent.setup()
    renderApp('/')

    await openPicker(user)
    await user.click(screen.getByRole('menuitemradio', { name: 'Dracula' }))

    expect(document.documentElement.getAttribute('data-theme')).toBe('dracula')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dracula')
    expect(screen.queryByRole('menu', { name: 'Theme' })).not.toBeInTheDocument()
  })

  it('restores a stored theme before the picker is ever opened', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'nord')
    renderApp('/')

    expect(document.documentElement.getAttribute('data-theme')).toBe('nord')
    expect(screen.getByRole('button', { name: 'Theme: Nord' })).toBeInTheDocument()
  })

  // A stored id that no longer exists must not leave the page unstyled.
  it('falls back to following the system for an unknown stored theme', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'a-theme-we-removed')
    renderApp('/')

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('system')
  })

  // Each swatch previews a palette by carrying that theme's data-theme, so the
  // menu shows real colours instead of a second copy of them in JavaScript.
  it('previews every theme with a swatch bound to that palette', async () => {
    const user = userEvent.setup()
    renderApp('/')

    await openPicker(user)

    for (const theme of THEMES) {
      expect(
        document.querySelector(`.theme-swatch[data-theme='${theme.id}']`),
      ).toBeInTheDocument()
    }
  })

  it('closes on Escape and hands focus back to the button', async () => {
    const user = userEvent.setup()
    renderApp('/')

    const button = screen.getByRole('button', { name: /^Theme:/ })
    await openPicker(user)
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('menu', { name: 'Theme' })).not.toBeInTheDocument()
    expect(button).toHaveFocus()
  })
})
