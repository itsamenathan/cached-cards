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

## Themes
- Palettes live in `src/index.css` as `[data-theme='<id>']` blocks; `src/themes.js`
  holds only the id, label, mode, and browser chrome colour.
- Adding a theme means adding both. `src/themes.test.js` then checks the block
  exists and that its text and accent colours meet the contrast floors.
- The pre-paint script in `index.html` gets its colour map injected from
  `src/themes.js` by the `themeBootstrap` plugin in `vite.config.js`.
- `cached-cards-theme` stores the *preference*, which may be `system`.

## Conventions
- Keep UI mobile-first and high-contrast for dim settings.
- Prefer simple fetch + frontmatter parsing (no extra server).
