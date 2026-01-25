import { useEffect, useMemo, useRef, useState } from 'react'
import matter from 'gray-matter'
import ReactMarkdown from 'react-markdown'

const PLAYER_FILTERS = ['Any', 2, 3, 4, 5, 6]

const formatTags = (tags) =>
  Array.isArray(tags) ? tags.map((tag) => tag.toString()) : []

const toSlug = (filename) => filename.replace(/\.md$/, '')

export default function App() {
  const [rules, setRules] = useState([])
  const [activeRuleId, setActiveRuleId] = useState(null)
  const [query, setQuery] = useState('')
  const [playerFilter, setPlayerFilter] = useState('Any')
  const [status, setStatus] = useState('loading')
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [selectedTags, setSelectedTags] = useState([])
  const [recentIds, setRecentIds] = useState([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [theme, setTheme] = useState('dark')
  const [viewMode, setViewMode] = useState('library')
  const ruleModules = useMemo(
    () =>
      import.meta.glob('/rules/*.md', {
        eager: true,
        query: '?raw',
        import: 'default',
      }),
    [],
  )
  const detailRef = useRef(null)
  const wasDesktopRef = useRef(window.innerWidth >= 900)

  useEffect(() => {
    let isMounted = true

    const loadRules = () => {
      try {
        const entries = Object.entries(ruleModules).map(([path, raw]) => {
          const filename = path.split('/').pop() || 'unknown.md'
          const { data, content } = matter(raw)
          return {
            id: toSlug(filename),
            slug: filename,
            title: data.title || 'Untitled',
            shortDescription: data.short_description || '',
            playersLabel: data.players || '',
            minPlayers: Number(data.min_players || 0),
            maxPlayers: Number(data.max_players || 0),
            difficulty: data.difficulty || 'Unknown',
            category: data.category || 'General',
            tags: formatTags(data.tags),
            deck: data.deck || '',
            content,
          }
        })

        entries.sort((a, b) => a.title.localeCompare(b.title))

        if (isMounted) {
          setRules(entries)
          setActiveRuleId(entries[0]?.id ?? null)
          setStatus('ready')
        }
      } catch (_) {
        if (isMounted) {
          setStatus('error')
        }
      }
    }

    loadRules()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('cached-cards-theme')
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme)
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light')
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem('cached-cards-theme', theme)
  }, [theme])

  useEffect(() => {
    try {
      const stored = JSON.parse(
        window.localStorage.getItem('cached-cards-recent') || '[]',
      )
      if (Array.isArray(stored)) {
        setRecentIds(stored)
      }
    } catch (_) {
      setRecentIds([])
    }
  }, [])

  useEffect(() => {
    const handleBeforeInstall = (event) => {
      event.preventDefault()
      setInstallPrompt(event)
    }

    const handleInstalled = () => setIsInstalled(true)

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)

    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsInstalled(standalone || window.navigator.standalone === true)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const filteredRules = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return rules.filter((rule) => {
      const matchesQuery = !needle || rule.title.toLowerCase().includes(needle)
      const matchesPlayers =
        playerFilter === 'Any' ||
        (rule.minPlayers <= playerFilter && rule.maxPlayers >= playerFilter)
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some((tag) => rule.tags.includes(tag))
      return matchesQuery && matchesPlayers && matchesTags
    })
  }, [rules, query, playerFilter, selectedTags])

  const availableTags = useMemo(() => {
    const tagSet = new Set()
    rules.forEach((rule) => {
      rule.tags.forEach((tag) => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [rules])

  const recentRules = useMemo(() => {
    if (recentIds.length === 0) return []
    const map = new Map(filteredRules.map((rule) => [rule.id, rule]))
    return recentIds.map((id) => map.get(id)).filter(Boolean)
  }, [recentIds, filteredRules])

  const toggleTag = (tag) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((item) => item !== tag)
      }
      return [...prev, tag]
    })
  }

  useEffect(() => {
    if (filteredRules.length === 0) return
    if (!activeRuleId || !filteredRules.some((rule) => rule.id === activeRuleId)) {
      setActiveRuleId(filteredRules[0].id)
    }
  }, [filteredRules, activeRuleId])

  const activeRule = filteredRules.find((rule) => rule.id === activeRuleId)

  useEffect(() => {
    if (!activeRule) return
    setRecentIds((prev) => {
      const next = [activeRule.id, ...prev.filter((id) => id !== activeRule.id)]
      const trimmed = next.slice(0, 3)
      window.localStorage.setItem(
        'cached-cards-recent',
        JSON.stringify(trimmed),
      )
      return trimmed
    })
  }, [activeRule])

  useEffect(() => {
    const updateView = () => {
      const isDesktop = window.innerWidth >= 900
      if (isDesktop && !wasDesktopRef.current) {
        setViewMode('split')
      }
      if (!isDesktop && wasDesktopRef.current) {
        setViewMode('library')
      }
      wasDesktopRef.current = isDesktop
    }

    updateView()
    window.addEventListener('resize', updateView)
    return () => window.removeEventListener('resize', updateView)
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      if (window.innerWidth < 900) {
        setViewMode('library')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Cached Cards</h1>
          <p className="subhead">
            Rules ready for game night, even when the Wi-Fi isn&apos;t.
          </p>
        </div>
        <div className="header-actions">
          {installPrompt && !isInstalled && (
            <button className="install-btn" onClick={handleInstall}>
              Install App
            </button>
          )}
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? '🌞' : '🌙'}
          </button>
        </div>
      </header>

      <main className={`app-main ${viewMode === 'detail' ? 'detail-only' : ''}`}>
        <section className={`library ${viewMode === 'detail' ? 'hidden' : ''}`}>
          <div className="library-topbar">
            <div className="search-mini">
              <input
                id="search"
                type="search"
                placeholder="Search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <button
              type="button"
              className="filter-pill"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              Filters
              {(playerFilter !== 'Any' || selectedTags.length > 0 || query) && (
                <span className="filter-count">
                  {[
                    playerFilter !== 'Any',
                    selectedTags.length > 0,
                    query,
                  ].filter(Boolean).length}
                </span>
              )}
            </button>
            {status === 'ready' && recentRules.length > 0 && (
              <div className="recent-inline">
                {recentRules.map((rule) => (
                  <button
                    key={rule.id}
                    className={`recent-chip${rule.id === activeRuleId ? ' active' : ''}`}
                    onClick={() => {
                      setActiveRuleId(rule.id)
                      if (window.innerWidth < 900) {
                        setFiltersOpen(false)
                        setViewMode('detail')
                        window.history.pushState({ view: 'detail' }, '')
                      }
                    }}
                  >
                    <span className="recent-initials">
                      {rule.title
                        .split(' ')
                        .slice(0, 2)
                        .map((word) => word[0])
                        .join('')
                        .toUpperCase()}
                    </span>
                    {rule.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={`filters-drawer${filtersOpen ? ' open' : ''}`}>
            <div className="filter-field">
              <label htmlFor="players">Players</label>
              <select
                id="players"
                value={playerFilter}
                onChange={(event) =>
                  setPlayerFilter(
                    event.target.value === 'Any'
                      ? 'Any'
                      : Number(event.target.value),
                  )
                }
              >
                {PLAYER_FILTERS.map((value) => (
                  <option key={value} value={value}>
                    {value === 'Any' ? 'Any count' : `${value} players`}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-field">
              <label>Tags</label>
              <div className="tag-filter">
                <button
                  type="button"
                  className={`tag-toggle${selectedTags.length === 0 ? ' active' : ''}`}
                  onClick={() => setSelectedTags([])}
                >
                  All tags
                </button>
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`tag-toggle${selectedTags.includes(tag) ? ' active' : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="drawer-close"
              onClick={() => setFiltersOpen(false)}
            >
              Close
            </button>
          </div>

          <div className="library-list">
            {status === 'loading' && (
              <div className="state">Loading the library…</div>
            )}
            {status === 'error' && (
              <div className="state">Couldn&apos;t load the rules.</div>
            )}
            {status === 'ready' && filteredRules.length === 0 && (
              <div className="state">No games match those filters.</div>
            )}
            {filteredRules.map((rule) => (
              <button
                key={rule.id}
                className={`rule-card${rule.id === activeRuleId ? ' active' : ''}`}
                onClick={() => {
                  setActiveRuleId(rule.id)
                  if (window.innerWidth < 900) {
                    setFiltersOpen(false)
                    setViewMode('detail')
                    window.history.pushState({ view: 'detail' }, '')
                  }
                }}
              >
                <div className="rule-card-header">
                  <h2>{rule.title}</h2>
                  <span className="difficulty">{rule.difficulty}</span>
                </div>
                <p>{rule.shortDescription}</p>
                <div className="rule-meta">
                  <span>{rule.playersLabel}</span>
                  <span>{rule.deck || rule.category}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section
          className={`detail ${viewMode === 'detail' ? 'active' : ''}`}
          ref={detailRef}
        >
          {activeRule ? (
            <>
              {viewMode === 'detail' && (
                <button
                  type="button"
                  className="back-button"
                  onClick={() => setViewMode('library')}
                >
                  ← Back to library
                </button>
              )}
              <div className="detail-header">
                <div>
                  <h2>{activeRule.title}</h2>
                  <p>{activeRule.shortDescription}</p>
                </div>
                <div className="pill-group">
                  <span className="pill">{activeRule.playersLabel}</span>
                  <span className="pill">{activeRule.difficulty}</span>
                  <span className="pill">{activeRule.category}</span>
                </div>
              </div>
              <div className="tags">
                {activeRule.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
              <article className="markdown">
                <ReactMarkdown>{activeRule.content}</ReactMarkdown>
              </article>
            </>
          ) : (
            <div className="state">Select a game to read the rules.</div>
          )}
        </section>
      </main>
      <footer className="app-footer">
        <a
          className="footer-icon"
          href="https://github.com/itsamenathan/cached-cards"
          target="_blank"
          rel="noreferrer"
          aria-label="Cached Cards on GitHub"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 2C6.48 2 2 6.58 2 12.26c0 4.55 2.87 8.41 6.84 9.78.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.63-3.37-1.37-3.37-1.37-.46-1.21-1.12-1.53-1.12-1.53-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.58 2.36 1.12 2.94.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.74 0 0 .84-.28 2.75 1.05.8-.23 1.66-.35 2.52-.35.86 0 1.72.12 2.52.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.43.2 2.48.1 2.74.64.72 1.03 1.63 1.03 2.75 0 3.93-2.35 4.79-4.59 5.04.36.33.68.98.68 1.98 0 1.43-.01 2.58-.01 2.93 0 .27.18.6.69.49 3.96-1.37 6.83-5.23 6.83-9.78C22 6.58 17.52 2 12 2z"
            />
          </svg>
        </a>
        <span className="footer-text">Cached Cards is open source</span>
        <a
          href="https://github.com/itsamenathan/cached-cards/blob/main/CONTRIBUTING.md"
          target="_blank"
          rel="noreferrer"
        >
          Contribute a rule
        </a>
        <a
          href="https://github.com/itsamenathan/cached-cards/issues"
          target="_blank"
          rel="noreferrer"
        >
          Report an issue
        </a>
        <span className="footer-version">v{__APP_VERSION__}</span>
      </footer>
    </div>
  )
}
