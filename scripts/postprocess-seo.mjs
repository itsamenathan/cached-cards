import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const base = 'https://cachedcards.com'
const distDir = path.join(process.cwd(), 'dist')
const rulesDir = path.join(process.cwd(), 'rules')

const readRules = () => {
  const rules = new Map()
  for (const file of fs.readdirSync(rulesDir)) {
    if (!file.endsWith('.md')) continue
    const slug = file.replace(/\.md$/, '')
    const raw = fs.readFileSync(path.join(rulesDir, file), 'utf8')
    const { data } = matter(raw)
    rules.set(slug, {
      title: data.title || slug,
      description: data.short_description || 'Card game rules.',
      tags: Array.isArray(data.tags) ? data.tags : [],
      minPlayers: Number(data.min_players || 0),
      maxPlayers: Number(data.max_players || 0),
    })
  }
  return rules
}

const injectHead = (html, meta) => {
  const canonicalTag = `<link rel="canonical" href="${meta.url}" />`
  const ogTags = [
    `<meta property="og:title" content="${meta.title}" />`,
    `<meta property="og:description" content="${meta.description}" />`,
    `<meta property="og:type" content="${meta.type}" />`,
    `<meta property="og:url" content="${meta.url}" />`,
    `<meta property="og:image" content="${meta.image}" />`,
  ].join('\n    ')

  const descriptionTag = `<meta name="description" content="${meta.description}" />`

  const jsonLd = `<script type="application/ld+json">${JSON.stringify(meta.schema)}</script>`

  const headClose = '</head>'
  let next = html
    .replace(/<title>.*?<\/title>/, `<title>${meta.title}</title>`)
    .replace(/<meta name="description"[^>]*>/, descriptionTag)
    .replace(/<meta property="og:title"[^>]*>[\s\S]*?<meta property="og:image"[^>]*>/, ogTags)

  if (!next.includes('rel="canonical"')) {
    next = next.replace(headClose, `  ${canonicalTag}\n  ${jsonLd}\n${headClose}`)
  } else {
    next = next.replace(/<link rel="canonical"[^>]*>/, canonicalTag)
    next = next.replace(headClose, `  ${jsonLd}\n${headClose}`)
  }

  return next
}

const rules = readRules()

const baseMeta = {
  title: 'Cached Cards',
  description: 'Offline-first library of card game rules. Works without Wi-Fi.',
  url: `${base}/`,
  image: `${base}/icons/icon-512.png`,
  type: 'website',
  schema: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Cached Cards',
    url: `${base}/`,
    description: 'Offline-first library of card game rules.',
  },
}

const indexPath = path.join(distDir, 'index.html')
if (fs.existsSync(indexPath)) {
  const html = fs.readFileSync(indexPath, 'utf8')
  fs.writeFileSync(indexPath, injectHead(html, baseMeta))
}

for (const [slug, data] of rules.entries()) {
  const pagePath = path.join(distDir, 'rules', slug, 'index.html')
  if (!fs.existsSync(pagePath)) continue
  const url = `${base}/rules/${slug}/`
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Game',
    name: data.title,
    description: data.description,
    url,
    genre: data.tags,
  }
  if (data.minPlayers || data.maxPlayers) {
    schema.numberOfPlayers = {
      '@type': 'QuantitativeValue',
      minValue: data.minPlayers || undefined,
      maxValue: data.maxPlayers || undefined,
    }
  }

  const meta = {
    title: `${data.title} | Cached Cards`,
    description: data.description,
    url,
    image: `${base}/icons/icon-512.png`,
    type: 'article',
    schema,
  }
  const html = fs.readFileSync(pagePath, 'utf8')
  fs.writeFileSync(pagePath, injectHead(html, meta))
}
