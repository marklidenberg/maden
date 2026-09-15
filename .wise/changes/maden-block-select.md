> Read `wise change` skill before editing this file

# What

A selected list item selects its children too, drawn as one highlight.

# Design

- children — a fold's: the blocks after the item, indent deeper
- `BlockSelectPlugin` — follows `selectedIds` in the store: every selected list item's children added; an area drag, on release
- highlight — a selected top-level block's stretched down to its lowest shown selected child; the children's, none
- regions `block-select` — `block-selection.tsx`, `block-selection-kit.tsx`

## Plan

- wise-plan
  - [x] - lib: children, groups, plugin
  - [x] - the stretched highlight
  - [x] - regions, change doc
  - [/] - tests, typecheck
  - [ ] - merge into `fork-fba28f70`

---

# Exploration

## Research

- `@platejs/selection` — every path writes `selectedIds` through the option store: handle click `set`, Esc, context menu, arrows, area drag `move`
- area drag — adds and removes by what it touches; ids added beside it are never removed by it
- highlight — `belowRootNodes`, `absolute inset-0` in the block's root; indent is the root's `marginLeft`
- `src/webview/lib/fold.ts` — `lastChildIndex`, the children
