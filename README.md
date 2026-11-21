[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/soedirman566-stack/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/soedirman566-stack/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Trophy Guide — GTA VI Trophy Tracker & Roadmap

A free, offline trophy guide and tracker for **Grand Theft Auto VI on PlayStation 5**, built for the
make.fun bounty *gta6-trophy-guide-01*. It covers all **55 official trophies** — 1 platinum, 2 gold,
6 silver, 46 bronze — each with its official name, description and grade, an original guide written
for this entry, and a source line naming where the guide's facts come from.

## What it does

- **Full checklist** of all 55 trophies with official names, descriptions and grade badges. Tick
  trophies off as you earn them; progress is saved in the browser (localStorage).
- **A guide for every trophy**, in this entry's own words: what to do, where and how as far as the
  official description supports it, and when the trophy can be missed. Every guide cites its sources
  (Exophase's GTA VI trophy list, PSNProfiles' GTA VI trophy guide, PowerPyx's GTA VI trophy guide &
  roadmap). Where the official description is deliberately cryptic, the guide says so and invents
  nothing.
- **Roadmap to the platinum**: seven stages in play order — the opening, the story campaign, the
  finale and 100%, the stranger strands, the activity cleanup, the collectible and money sweep, and
  the platinum itself (`app/data/roadmap.json`).
- **Missables flagged**: three trophies are marked MISSABLE, each flagged from its official
  description (a one-time event, a story point of no return, or a tracked choice): *Fair Game*
  (Bret's unique-animal hunt), *Catch Me If You Can* (the unscheduled VCIA departure) and *Actions
  Speak Louder* (500 tracked choices). A dedicated Missables view collects them with their guides.
- **Counters** for the tracked trophies (250 stunts, 42 shooting-range golds, 100 WAiNK spots,
  $250,000 laundered, and the rest), with progress bars; hitting a target marks the trophy earned.
- **Filters**: kind chips (Story, Missable, Collectibles, Activities, Online), grade filter, text
  search, and a hide-earned toggle.
- **Spoiler protection**: when on, unearned story trophies (and the trophies PlayStation itself
  keeps hidden) show as "Hidden trophy" until you earn them.
- **Export / Import / Reset**: download your progress as a JSON file and restore it in any browser.
- **Fully offline**: the app is static files that fetch nothing but their own data. No accounts, no
  tracking, no Rockstar artwork or logos — the look is original CSS.

## Run it

```sh
node serve.ts            # serves app/ at http://localhost:8080
```

Any static file server pointed at `app/` works just as well; there is no build step. Open
`app/index.html` through the server and the guide runs with the network off.

Handy preview links (also used for this entry's screenshots): `?view=roadmap`, `?view=missables`,
`?spoiler=1`, `?open=<trophy id>`, and `?seed=demo` for a sample progress state that never touches
your saved one.

## Layout

- `app/` — the guide itself: `index.html`, `app.js`, `style.css`, and `data/` (`trophies.json`, the
  enriched trophy list; `roadmap.json`, the platinum roadmap).
- `main.ts` — the hand-in program: copies `app/` and `screenshots/` to the output directory and
  writes `dossier.json` with the vendored make.fun library (`vendor/makefun-frontend.ts`, unchanged
  from the kit).
- `tools-build-data.mjs` — the generator that enriches the official trophy list with this entry's
  kinds, missable flags, roadmap stages and guides (`node tools-build-data.mjs`).
- `screenshots/` — four renders of the running app: the checklist with a guide open, the roadmap,
  the missables, and spoiler protection at work.

## Data and sources

Trophy names, descriptions and grades are the official PlayStation list for Grand Theft Auto VI, as
published and as listed by Exophase and PSNProfiles (the two agree on every name, description and
grade). The guides, kind classifications, missable flags, hidden flags and roadmap are this entry's
own work, written for this entry; they cite Exophase, PSNProfiles and PowerPyx as sources and copy
none of their text.

This is a fan-made tool, not affiliated with Rockstar Games, Take-Two Interactive or PlayStation.
Licensed under the MIT License (see `LICENSE`).
