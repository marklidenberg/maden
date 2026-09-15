# block-indent

Tab and shift-tab move the selected blocks — a list item with its children, as `block-select` took
them. Upstream moves the caret's line alone and leaves Tab over selected blocks to the browser: the
focus leaves the editor.

- each selected block one step, by the caret's own transform — a block indent does not reach, untouched
- the caret's line — upstream's, alone

Files:

- `src/webview/lib/block-indent.ts` — ours: Tab over the selected blocks
- `src/webview/components/editor/plugins/block-selection-kit.tsx` — `onKeyDownSelecting` calls it
- `tests/unit/block-indent.test.ts` — ours
