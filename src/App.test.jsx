import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from './App.jsx'

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
