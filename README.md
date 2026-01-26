# Cached Cards

Cached Cards is a fast, offline‑first PWA for card game rules. It loads all rules from Markdown files, works without a network connection, and is installable on mobile.

## Features
- Offline‑first PWA (service worker + precached assets)
- 25+ card game rules in Markdown with frontmatter
- Instant search + player count + tag filtering
- Mobile‑focused reading mode with back navigation
- Light/Dark theme toggle

## Live Site
- https://cachedcards.com

## Adding a Rule
1) Create a new Markdown file in `rules/`.
2) Use the frontmatter format below:

```yaml
---
title: "Canasta"
short_description: "Rummy partnership game of melds and canastas."
players: "2-6 players"
min_players: 2
max_players: 6
difficulty: "Medium"
tags: ["rummy", "partnership"]
deck: "Two standard 52-card decks + jokers"
---
```

3) Write the rules with clear sections:

```md
# Game Name

## Goal
...

## Setup
...

## Turn Order
1. ...
2. ...

## Special Rules
...

## Scoring
...

## End
...
```

That’s it—no index file needed. All `rules/*.md` files are auto‑loaded.

## Development

```bash
devbox run -- npm install
```

```bash
devbox run -- npm run dev
```

## Build & Preview

```bash
devbox run -- npm run build
devbox run -- npm run preview
```

## Deploy (GitHub Pages)
- CI workflow builds and deploys on push to `main`.
- Custom domain is configured via `public/CNAME`.

## Analytics
Vince analytics loads only in production builds.

## License
MIT
