# Contributing to Cached Cards

Thanks for your interest in improving Cached Cards! This project is an offline-first PWA for card game rules. Contributions are welcome.

## Quick Start
- Install dependencies: `devbox run -- npm install`
- Run the dev server: `devbox run -- npm run dev`

## Adding a New Rule
Rules are stored as Markdown files in the `rules/` directory. Each file **must** include YAML frontmatter metadata.

1) Create a new file in `rules/`, for example `rules/canasta.md`
2) Use the following frontmatter format:

```yaml
---
title: "Canasta"
short_description: "Rummy-style game of melds and canastas."
players: "2-6 players"
min_players: 2
max_players: 6
difficulty: "Medium"
category: "Matching"
tags: ["classic", "partnership", "melding"]
deck: "Two standard 52-card decks + jokers"
---
```

3) Write rules in a consistent, skimmable format:

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

4) No index update needed — all `rules/*.md` files are auto-loaded.

## Design Guidelines
- Keep rules concise and easy to skim.
- Use clear section headings and short bullet lists.
- Avoid excessive formatting or long paragraphs.

## PWA Notes
- Assets and rule files are bundled into the build for offline use.
- Test offline behavior with `npm run build` + `npm run preview`.

## Pull Request Checklist
- [ ] New rules include required frontmatter fields.
- [ ] Rules render properly in the app.
- [ ] Keep changes focused; avoid unrelated refactors.
- [ ] Run `npm run build` if you change build or PWA behavior.

## Code Style
- Prefer small, readable components and minimal dependencies.
- Keep styling in `src/index.css`.
- Avoid adding new fonts unless necessary.

## Reporting Issues
Please include:
- Reproduction steps
- Browser/device info
- Screenshots (if UI-related)

Thanks for contributing!
