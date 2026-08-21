import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import matter from 'gray-matter'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const PLAYER_FILTERS = ['Any', 2, 3, 4, 5, 6]
const DESKTOP_WIDTH = 900
const DETAIL_BAR_HEIGHT = 56

const formatTags = (tags) =>
  Array.isArray(tags) ? tags.map((tag) => tag.toString()) : []

const toSlug = (filename) => filename.replace(/\.md$/, '')

// Every rule file opens with an `# H1` that repeats the frontmatter title, and
// the detail header already renders that title.
const stripLeadingHeading = (content) =>
  content.replace(/^\s*#\s+[^\n]*\n+/, '')

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Short titles like "500" lose all meaning when reduced to one letter, and a
// lone "C" does not say "Cribbage" either.
const initialsFor = (title) => {
  if (title.length <= 3) return title.toUpperCase()
  const words = title.split(' ').filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

const TableHeadersContext = createContext([])

const nodeText = (node) => {
  if (!node) return ''
  if (node.type === 'text') return node.value
  if (Array.isArray(node.children)) return node.children.map(nodeText).join('')
  return ''
}

const headerLabels = (tableNode) => {
  const head = tableNode?.children?.find((child) => child.tagName === 'thead')
  const row = head?.children?.find((child) => child.tagName === 'tr')
  return (row?.children ?? [])
    .filter((cell) => cell.tagName === 'th')
    .map((cell) => nodeText(cell).trim())
}

// Lookup grids in the rules are wider than a phone screen. Narrow ones just
// wrap, but anything four columns or more is restacked into labelled rows so
// the right-hand columns (the points, the payouts) can never be cut off.
const markdownComponents = {
  table: ({ node, children }) => {
    const labels = headerLabels(node)
    return (
      <TableHeadersContext.Provider value={labels}>
        <div className={`table-scroll${labels.length >= 4 ? ' stacked' : ''}`}>
          <table>{children}</table>
        </div>
      </TableHeadersContext.Provider>
    )
  },
  tr: ({ children }) => {
    let column = 0
    return (
      <tr>
        {Children.map(children, (child) =>
          isValidElement(child)
            ? cloneElement(child, { columnIndex: column++ })
            : child,
        )}
      </tr>
    )
  },
  th: ({ children, style }) => <th style={style}>{children}</th>,
  td: MarkdownCell,
}

function MarkdownCell({ children, columnIndex = 0, style }) {
  const labels = useContext(TableHeadersContext)
  return (
    <td data-label={labels[columnIndex] ?? ''} style={style}>
      {children}
    </td>
  )
}

function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      className="theme-toggle"
      onClick={onToggle}
      aria-label={
        theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
      }
    >
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-13.5a1 1 0 0 1 1 1V6a1 1 0 1 1-2 0V4.5a1 1 0 0 1 1-1Zm0 15a1 1 0 0 1 1 1v1.5a1 1 0 1 1-2 0V19.5a1 1 0 0 1 1-1ZM3.5 12a1 1 0 0 1 1-1H6a1 1 0 1 1 0 2H4.5a1 1 0 0 1-1-1Zm14.5 0a1 1 0 0 1 1-1h1.5a1 1 0 1 1 0 2H19a1 1 0 0 1-1-1ZM5.6 5.6a1 1 0 0 1 1.4 0l1.1 1.1a1 1 0 0 1-1.4 1.4L5.6 7a1 1 0 0 1 0-1.4Zm10.3 10.3a1 1 0 0 1 1.4 0l1.1 1.1a1 1 0 0 1-1.4 1.4l-1.1-1.1a1 1 0 0 1 0-1.4Zm2.5-10.3a1 1 0 0 1 0 1.4L17.3 8.1a1 1 0 1 1-1.4-1.4L17 5.6a1 1 0 0 1 1.4 0ZM8.1 15.9a1 1 0 0 1 0 1.4L7 18.4A1 1 0 0 1 5.6 17l1.1-1.1a1 1 0 0 1 1.4 0Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21.4 13.6A9 9 0 1 1 10.4 2.6a7 7 0 0 0 11 11Z" />
        </svg>
      )}
    </button>
  )
}

export default function App() {
  const isClient = typeof window !== 'undefined'
  const getInitialTheme = () => {
    if (!isClient) return 'dark'
    const storedTheme = window.localStorage.getItem('cached-cards-theme')
    if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme
    return window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark'
  }
  const getInitialRecentIds = () => {
    if (!isClient) return []
    try {
      const stored = JSON.parse(
        window.localStorage.getItem('cached-cards-recent') || '[]',
      )
      return Array.isArray(stored) ? stored : []
    } catch {
      return []
    }
  }
  const getInitialInstalled = () =>
    isClient &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true)
  const [query, setQuery] = useState('')
  const [playerFilter, setPlayerFilter] = useState('Any')
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(getInitialInstalled)
  const [showIosInstall, setShowIosInstall] = useState(false)
  const [selectedTags, setSelectedTags] = useState([])
  const [recentIds, setRecentIds] = useState(getInitialRecentIds)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [theme, setTheme] = useState(getInitialTheme)
  const [viewMode, setViewMode] = useState('library')
  const [detailHighlight, setDetailHighlight] = useState(false)
  // Without IntersectionObserver there is no way to know when the heading
  // leaves the viewport, so fall back to always showing the bar title.
  const [titleScrolledOut, setTitleScrolledOut] = useState(
    () => isClient && typeof IntersectionObserver === 'undefined',
  )
  const navigate = useNavigate()
  const { slug } = useParams()
  const ruleModules = useMemo(
    () =>
      import.meta.glob('/rules/*.md', {
        eager: true,
        query: '?raw',
        import: 'default',
      }),
    [],
  )
  const rules = useMemo(() => {
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
        tags: formatTags(data.tags),
        deck: data.deck || '',
        content: stripLeadingHeading(content),
      }
    })

    entries.sort((a, b) => a.title.localeCompare(b.title))
    return entries
  }, [ruleModules])
  // The rule on screen is whatever the URL names. It must never be swapped out
  // by an unrelated search or filter change.
  const activeRule = useMemo(
    () => (slug ? (rules.find((rule) => rule.id === slug) ?? null) : null),
    [rules, slug],
  )
  const activeRuleId = activeRule?.id ?? null
  const notFound = Boolean(slug) && !activeRule
  const status = rules.length ? 'ready' : 'error'
  const detailRef = useRef(null)
  const detailTitleRef = useRef(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem('cached-cards-theme', theme)
    document
      .getElementById('theme-color')
      ?.setAttribute('content', theme === 'light' ? '#f6f1e7' : '#0b0d12')
  }, [theme])

  useEffect(() => {
    const handleBeforeInstall = (event) => {
      event.preventDefault()
      setInstallPrompt(event)
    }

    const handleInstalled = () => setIsInstalled(true)

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const filteredRules = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return rules.filter((rule) => {
      const haystack = [rule.title, rule.shortDescription, ...rule.tags]
        .join(' ')
        .toLowerCase()
      const matchesQuery = !needle || haystack.includes(needle)
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

  // Recents are a shortcut back to what you were reading, so they stay put
  // regardless of the current search and filters.
  const recentRules = useMemo(() => {
    if (recentIds.length === 0) return []
    const map = new Map(rules.map((rule) => [rule.id, rule]))
    return recentIds.map((id) => map.get(id)).filter(Boolean)
  }, [recentIds, rules])

  const toggleTag = (tag) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((item) => item !== tag)
      }
      return [...prev, tag]
    })
  }

  // The sticky bar repeats the game name, which is noise while the real
  // heading is still on screen. Reveal it only once the heading is gone.
  useEffect(() => {
    if (!isClient || !activeRuleId || viewMode !== 'detail') return undefined
    const heading = detailTitleRef.current
    if (!heading) return undefined
    if (typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(
      ([entry]) => setTitleScrolledOut(!entry.isIntersecting),
      // Push the root's top edge below the sticky bar so the swap happens
      // exactly as the heading slides under it.
      { rootMargin: `-${DETAIL_BAR_HEIGHT}px 0px 0px 0px` },
    )
    observer.observe(heading)
    return () => observer.disconnect()
  }, [isClient, activeRuleId, viewMode])

  useEffect(() => {
    if (!activeRuleId) return
    if (window.innerWidth >= DESKTOP_WIDTH) {
      if (detailRef.current) {
        detailRef.current.scrollIntoView({
          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
          block: 'start',
        })
      }
      window.requestAnimationFrame(() => setDetailHighlight(true))
      const highlightId = window.setTimeout(
        () => setDetailHighlight(false),
        900,
      )
      return () => window.clearTimeout(highlightId)
    }
    window.scrollTo(0, 0)
  }, [activeRuleId])

  // History is written after the rule has painted: reading the rules is what
  // matters, recording the visit can wait a tick.
  useEffect(() => {
    if (!activeRuleId) return undefined
    const timeoutId = window.setTimeout(() => {
      setRecentIds((prev) => {
        if (prev[0] === activeRuleId) return prev
        const next = [activeRuleId, ...prev.filter((id) => id !== activeRuleId)]
        const trimmed = next.slice(0, 3)
        window.localStorage.setItem(
          'cached-cards-recent',
          JSON.stringify(trimmed),
        )
        return trimmed
      })
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [activeRuleId])

  useEffect(() => {
    if (!isClient) return
    let frame = 0
    const updateView = () => {
      if (window.innerWidth >= DESKTOP_WIDTH) {
        setViewMode('split')
      } else {
        setViewMode(slug ? 'detail' : 'library')
      }
    }
    // The mobile URL bar showing and hiding fires resize constantly.
    const onResize = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(updateView)
    }

    updateView()
    window.addEventListener('resize', onResize)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [slug, isClient])

  // Stop the page behind a filter sheet from scrolling under your finger.
  useEffect(() => {
    if (!isClient) return undefined
    const isSheet = window.innerWidth < DESKTOP_WIDTH
    if (!filtersOpen || !isSheet) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [filtersOpen, isClient])

  const openRule = (id) => {
    if (isClient && window.innerWidth < DESKTOP_WIDTH) {
      setFiltersOpen(false)
      setViewMode('detail')
    }
    navigate(`/rules/${id}`)
  }

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  const isIos = () => {
    if (!isClient) return false
    const ua = window.navigator.userAgent.toLowerCase()
    return /iphone|ipad|ipod/.test(ua)
  }

  const isSafari = () => {
    if (!isClient) return false
    const ua = window.navigator.userAgent.toLowerCase()
    return (
      ua.includes('safari') && !ua.includes('crios') && !ua.includes('fxios')
    )
  }

  const showIosButton = !installPrompt && !isInstalled && isIos() && isSafari()

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  // Each rule page is the reason the site exists, so the game title is its h1
  // and the wordmark steps down rather than competing with it.
  const Wordmark = slug ? 'p' : 'h1'

  const activeFilterCount = [
    playerFilter !== 'Any',
    selectedTags.length > 0,
    Boolean(query),
  ].filter(Boolean).length

  return (
    <div className="app">
      {viewMode !== 'detail' && (
        <header className="app-header">
          <div className="brand">
            <Wordmark className="wordmark">Cached Cards</Wordmark>
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
            {showIosButton && (
              <button
                className="install-btn"
                onClick={() => setShowIosInstall(true)}
              >
                Install on iOS
              </button>
            )}
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>
      )}

      <main
        className={`app-main ${viewMode === 'detail' ? 'detail-only' : ''}`}
      >
        <section
          className={`library ${viewMode === 'detail' ? 'hidden' : ''}`}
          aria-label="Game library"
        >
          <div className="library-topbar">
            <input
              id="search"
              type="search"
              placeholder="Search games and tags"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button
              type="button"
              className="filter-pill"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((open) => !open)}
            >
              Filters
              {activeFilterCount > 0 && (
                <span className="filter-count">{activeFilterCount}</span>
              )}
            </button>
          </div>

          {status === 'ready' && recentRules.length > 0 && (
            <div className="recent-row">
              {recentRules.map((rule) => (
                <button
                  key={rule.id}
                  className={`recent-chip${rule.id === activeRuleId ? ' active' : ''}`}
                  onClick={() => openRule(rule.id)}
                >
                  <span className="recent-initials">
                    {initialsFor(rule.title)}
                  </span>
                  {rule.title}
                </button>
              ))}
            </div>
          )}

          {filtersOpen && (
            <div
              className="filters-backdrop"
              onClick={() => setFiltersOpen(false)}
            />
          )}
          <div className={`filters-drawer${filtersOpen ? ' open' : ''}`}>
            <div className="filter-field">
              <span className="filter-label">Players</span>
              <div
                className="chip-row chip-row-even"
                role="group"
                aria-label="Player count"
              >
                {PLAYER_FILTERS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`chip chip-fixed${
                      playerFilter === value ? ' active' : ''
                    }`}
                    aria-pressed={playerFilter === value}
                    aria-label={
                      value === 'Any' ? 'Any player count' : `${value} players`
                    }
                    onClick={() => setPlayerFilter(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-field">
              <span className="filter-label">Tags</span>
              <div className="chip-row">
                <button
                  type="button"
                  className={`chip${selectedTags.length === 0 ? ' active' : ''}`}
                  onClick={() => setSelectedTags([])}
                >
                  All tags
                </button>
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`chip${selectedTags.includes(tag) ? ' active' : ''}`}
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
              {`Show ${filteredRules.length} ${
                filteredRules.length === 1 ? 'game' : 'games'
              }`}
            </button>
          </div>

          <div className="library-list">
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
                onClick={() => openRule(rule.id)}
              >
                <div className="rule-card-header">
                  <span className="rule-card-title">{rule.title}</span>
                  <span className="difficulty">{rule.difficulty}</span>
                </div>
                <p>{rule.shortDescription}</p>
                <div className="rule-meta">
                  <span>{rule.playersLabel}</span>
                  <div className="rule-tags">
                    {rule.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="rule-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section
          className={`detail ${viewMode === 'detail' ? 'active' : ''}${
            detailHighlight ? ' highlight' : ''
          }`}
          ref={detailRef}
        >
          {viewMode === 'detail' && (
            <div
              className={`detail-bar${titleScrolledOut ? ' condensed' : ''}`}
            >
              <button
                type="button"
                className="back-button"
                aria-label="Back to library"
                onClick={() => {
                  setViewMode('library')
                  navigate('/')
                }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M14.5 5.5 8 12l6.5 6.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="back-label">Library</span>
              </button>
              {activeRule && (
                <span
                  className="detail-bar-title"
                  aria-hidden={!titleScrolledOut}
                >
                  {activeRule.title}
                </span>
              )}
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
          )}
          {activeRule ? (
            <>
              <div className="detail-header">
                <h1 ref={detailTitleRef}>{activeRule.title}</h1>
                <p>{activeRule.shortDescription}</p>
                <div className="pill-group">
                  <span className="pill">{activeRule.playersLabel}</span>
                  <span className="pill">{activeRule.difficulty}</span>
                  {activeRule.deck && (
                    <span className="pill">{activeRule.deck}</span>
                  )}
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
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {activeRule.content}
                </ReactMarkdown>
              </article>
            </>
          ) : notFound ? (
            <div className="onboarding markdown">
              <h1>We don&apos;t have that game</h1>
              <p>
                There are no rules filed under &ldquo;{slug}&rdquo;. It may have
                been renamed since you saved the link.
              </p>
              <button
                type="button"
                className="install-btn"
                onClick={() => {
                  setViewMode('library')
                  navigate('/')
                }}
              >
                Browse all games
              </button>
            </div>
          ) : (
            <div className="onboarding markdown">
              <h2>Welcome to Cached Cards</h2>
              <p>
                Pick any game from the library to open its rules. Everything is
                cached so you can still read during spotty Wi-Fi or airplane
                mode.
              </p>
              <h3>How to use it</h3>
              <ul>
                <li>Search by game name, tag, or description.</li>
                <li>Use Filters to narrow by player count or tags.</li>
                <li>Open a rule card to read setup, flow, and scoring.</li>
                <li>Use Install App for quick home screen access.</li>
              </ul>
            </div>
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
            <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.55 2.87 8.41 6.84 9.78.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.63-3.37-1.37-3.37-1.37-.46-1.21-1.12-1.53-1.12-1.53-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.58 2.36 1.12 2.94.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.74 0 0 .84-.28 2.75 1.05.8-.23 1.66-.35 2.52-.35.86 0 1.72.12 2.52.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.43.2 2.48.1 2.74.64.72 1.03 1.63 1.03 2.75 0 3.93-2.35 4.79-4.59 5.04.36.33.68.98.68 1.98 0 1.43-.01 2.58-.01 2.93 0 .27.18.6.69.49 3.96-1.37 6.83-5.23 6.83-9.78C22 6.58 17.52 2 12 2z" />
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
        <span className="footer-version">
          v{__BUILD_DATE__}
          {__GIT_SHA__ !== 'unknown' && (
            <>
              {' '}
              ·{' '}
              <a
                className="footer-commit"
                href={`https://github.com/itsamenathan/cached-cards/commit/${__GIT_SHA__}`}
                target="_blank"
                rel="noreferrer"
              >
                {__GIT_SHA__}
              </a>
            </>
          )}
        </span>
      </footer>
      {showIosInstall && (
        <div
          className="modal-backdrop"
          onClick={() => setShowIosInstall(false)}
        >
          <div
            className="modal-card"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Install on iPhone/iPad</h3>
            <ol>
              <li>Tap the Share button in Safari.</li>
              <li>Select “Add to Home Screen”.</li>
              <li>Tap Add.</li>
            </ol>
            <button
              className="drawer-close"
              onClick={() => setShowIosInstall(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
