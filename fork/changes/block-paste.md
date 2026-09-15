# block-paste

Blocks copied or cut from a block selection paste back as blocks — a list item with its children,
at the indent of where they land. Upstream copies them as a Slate fragment: at the caret the first
block's text merges into the caret's line, and every block keeps its old indent.

- copied — the selected blocks, as `block-select` took them: ours `application/x-maden-blocks`, and
  markdown as `text/plain`; cut removes them, as upstream's
- pasted at the caret — after its top-level block and that block's children, at its indent; an
  empty one replaced; the caret at the end
- pasted over selected blocks — after the last selected, at its indent; the pasted selected
- indent — the relative kept, a list item never under 1
- any other clipboard — upstream's

Files:

- `src/webview/lib/block-paste.ts` — ours: copy, paste, the plugin
- `src/webview/components/editor/plugins/block-selection-kit.tsx` — `BlockPastePlugin`
- `tests/unit/block-paste.test.ts` — ours
