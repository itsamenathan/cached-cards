# AGENTS.md

You are Codex working in `/home/itsamenathan/dev/github/itsamenathan/cached-cards`.

## Project Summary
Cached Cards is a React + Vite PWA that provides an offline-first library of card game rules stored as Markdown with YAML frontmatter.

## Stack
- React + Vite
- vite-plugin-pwa (Workbox)
- react-markdown + gray-matter

## Key Paths
- `src/App.jsx` main UI, rule loading, filtering, and install prompt logic
- `src/index.css` UI styles
- `public/rules/` markdown rules with YAML frontmatter
- `public/rules/index.json` list of rule files to load
- `public/manifest.webmanifest` PWA manifest
- `vite.config.js` PWA config and Workbox caching

## Local Dev
- `devbox run -- npm install`
- `devbox run -- npm run dev`

## PWA Notes
- Rule files are fetched from `/rules/*.md` and cached with Workbox.
- Assets are precached on first load.

## Conventions
- Keep UI mobile-first and high-contrast for dim settings.
- Prefer simple fetch + frontmatter parsing (no extra server).
- Update `public/rules/index.json` whenever adding rules.
