import { render, screen, waitFor } from '@testing-library/react'
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

  it('shows a rule detail when the slug does not match any rule', () => {
    renderApp('/rules/not-a-real-rule')

    expect(screen.queryByText('Welcome to Cached Cards')).not.toBeInTheDocument()
    expect(document.querySelector('.rule-card.active')).toBeTruthy()
    expect(document.querySelector('.detail h2')?.textContent).toBeTruthy()
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
