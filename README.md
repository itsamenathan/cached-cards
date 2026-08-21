# Cached Cards

Cached Cards is a fast, offline‑first PWA for card game rules. It loads all rules from Markdown files, works without a network connection, and is installable on mobile.

## Features
- Offline‑first PWA (service worker + precached assets)
- 30 card game rules in Markdown with frontmatter
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

3) Write the rules using the standard section template:

```md
# Game Name

One or two sentences in plain language: what kind of game this is, what it
feels like to play, and roughly how long it takes. Assume the reader has
never heard of it.

## What You Need
- **Players:** ...
- **Deck:** ...
- **Extras:** ...

## Key Terms
- **Term:** Plain-language definition of anything the rules below assume.

## Setup
1. ...

## How to Play
1. ...

## Scoring & Winning
- ...

## Example
A short concrete scenario showing one turn or one trick.

## Variations
- **Name:** what changes.

## Tips for New Players
- ...
```

All eight `##` sections appear in every rule file, in that order. If a game
has no scoring, `## Scoring & Winning` still explains how the game ends. Lookup
grids such as bid values or card point values can use GFM tables; everything
else stays in bullets and numbered lists.
Games with several phases use `###` subsections inside `## How to Play`
(for example `### Bidding` and `### Trick play`) so the top-level shape
stays identical everywhere.

Rules are rendered with `react-markdown` plus `remark-gfm`. Use tables only for
genuine lookup grids and keep everything else in bullets and numbered lists;
see CONTRIBUTING.md for details.

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

## License
MIT
