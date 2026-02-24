# AGENTS.md

## Local Dev
- `devbox run -- npm install`
- `devbox run -- npm run dev`

## PWA Notes
- Rule files are fetched from `/rules/*.md` and cached with Workbox.
- Assets are precached on first load.

## Conventions
- Keep UI mobile-first and high-contrast for dim settings.
- Prefer simple fetch + frontmatter parsing (no extra server).
