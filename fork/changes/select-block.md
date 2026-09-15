# select-block

`cmd+A` in a block selects its text, then the block — its children with it, as `block-select` takes
them. Upstream reads any caret as the whole block: the first press selects every block, and in a
zoom all of its text. A range across blocks it leaves to the browser — the whole document's text.

- within one top-level block — its text not all selected, the text; all of it, or empty, the block
- across blocks — the zoom's text, then its blocks; out of a zoom, every block
- blocks selected — upstream's: every block, or the zoom's

Files:

- `src/webview/lib/select-block.ts` — ours: the plugin
- `src/webview/components/editor/editor-kit.tsx` — `SelectBlockPlugin`, after `NodeZoomKit`, so it
  wraps the zoom's select all
- `src/webview/lib/node-zoom.ts` — its block step, never reached, dropped
- `tests/unit/select-block.test.ts` — ours
