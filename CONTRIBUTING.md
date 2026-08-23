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
has no scoring, `## Scoring & Winning` still explains how the game ends.
Games with several phases use `###` subsections inside `## How to Play`
(for example `### Bidding` and `### Trick play`) so the top-level shape
stays identical everywhere.

Rules are rendered with `react-markdown` plus `remark-gfm`, so GitHub-flavored
tables are available. Use a table only for a genuine lookup grid — bid values,
card point values, scoring combinations — and keep prose, steps, and anything
with conditions in bullets or numbered lists. Tables scroll horizontally on
narrow screens, so aim for short cell text and no more than about six columns.

To put a table inside a numbered step, indent it three spaces so it stays part
of that list item instead of breaking the numbering.

4) No index update needed — all `rules/*.md` files are auto-loaded.

## Design Guidelines
- Write for someone who has never played the game before. Define jargon in
  `## Key Terms` before the rules use it, and say who deals, who goes first,
  and which direction play moves.
- Keep it skimmable at a table: short bullets, numbered steps for anything
  sequential, bold for the term being defined.
- Use the shared tag vocabulary rather than inventing new tags: `2-player`,
  `betting`, `classic`, `kids`, `matching`, `partnership`, `party`,
  `rummy`, `shedding`, `solitaire`, `speed`, `trick-taking`.
- Cite a reliable source when rules vary. [pagat.com](https://www.pagat.com/)
  is the reference this project uses; put genuinely optional rules under
  `## Variations` rather than presenting one group's house rules as standard.

## PWA Notes
- Assets and rule files are bundled into the build for offline use.
- Test offline behavior with `npm run build` + `npm run preview`.

## Pull Request Checklist
- [ ] New rules include required frontmatter fields.
- [ ] New rules follow the eight-section template, in order.
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
