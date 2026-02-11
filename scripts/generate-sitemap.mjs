import fs from 'node:fs'
import path from 'node:path'

const base = 'https://cachedcards.com'
const rulesDir = path.join(process.cwd(), 'rules')
const slugs = fs
  .readdirSync(rulesDir)
  .filter((file) => file.endsWith('.md'))
  .map((file) => file.replace(/\.md$/, ''))
  .sort()

const urls = [
  `${base}/`,
  ...slugs.map((slug) => `${base}/rules/${slug}/`),
]

const entries = urls
  .map((loc) => {
    const priority = loc === `${base}/` ? '1.0' : '0.6'
    return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`
  })
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`

fs.writeFileSync(path.join(process.cwd(), 'public', 'sitemap.xml'), xml)
