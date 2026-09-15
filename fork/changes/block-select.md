# block-select

A selected list item takes its children — the blocks a fold hides — and is drawn with them as one
highlight. Upstream selects the item alone and draws a highlight per block, each at its own indent.

- selected — every selected list item's children added, whoever wrote `selectedIds`; an area drag,
  once released
- a child stays selected while its item does
- drawn — a selected top-level block's highlight stretched down over its selected children right
  after it, to the lowest shown; theirs, none

Files:

- `src/webview/lib/block-select.ts` — ours: children, groups, the plugin
- `src/webview/components/ui/block-select.tsx` — ours: the stretched highlight
- `src/webview/components/ui/block-selection.tsx` — a top-level block's highlight, ours
- `src/webview/components/editor/plugins/block-selection-kit.tsx` — `BlockSelectPlugin`
- `tests/unit/block-select.test.ts` — ours
