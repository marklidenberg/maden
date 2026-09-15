> Read `wise change` skill before editing this file

# What

The top bar hidden by default; a button at the top right shows and hides it, the three dots just left of it.

# Design

- `TopbarToggle` — ours: panel-top open / close, flips `topbarVisible`, the menu's own props
- the button — after the three dots, in their fixed corner; the dots move left
- default — hidden; a stored `visible` shows it, as the menu's toggle stores it
- the bar's buttons — `calc(100% - 5rem)`, clear of both
- regions `topbar-toggle` — `appearance-menu.tsx`, `App.tsx`, `fixed-toolbar-buttons-trimmed.tsx`

## Plan

- wise-plan
  - [x] - button, default, regions
  - [x] - change doc
  - [x] - tests, typecheck
  - [x] - merge into `fork-fba28f70`

---

# Exploration

## Research

- `topbarVisible` — `App.tsx`, stored under `maden.ui.topbarVisible`; hidden → `data-maden-topbar='hidden'`, `index.css` hides the bar's buttons
- three dots — `AppearanceMenu`, `fixed top-1.5 right-2`, `h-8 w-8`; its "Toggle topbar" item stays
- the bar's buttons — `w-[calc(100%-2.75rem)]`, room for the dots alone
