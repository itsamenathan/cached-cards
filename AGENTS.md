# AGENTS.md

## Local Dev
- `npm install`
- `npm run dev`
- `npm run test`
- `npm run lint`
- `npm run build`
- `npm run preview`

## PWA Notes
- Rule files are fetched from `/rules/*.md` and cached with Workbox.
- Assets are precached on first load.
- `npm run build` runs `scripts/generate-sitemap.mjs` before build and `scripts/postprocess-seo.mjs` after static generation.

## Conventions
- Keep UI mobile-first and high-contrast for dim settings.
- Prefer simple fetch + frontmatter parsing (no extra server).
