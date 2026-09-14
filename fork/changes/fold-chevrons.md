# fold-chevrons

A list item with children gets a chevron — shown on hover, and while folded. A press folds its
children away, or brings them back. Upstream folds toggle blocks alone.

- children — the top-level blocks after the item, indent deeper; a continuation paragraph too
- folded — ids in the plugin's options, as upstream's toggle keeps `openIds`; the file untouched
- hidden — upstream toggle's style
- the chevron — left of the marker; a top-level item's left of the drag handle, beside its marker
- Enter on a folded item — the new item after its children, as upstream's toggle does
- the caret inside folded children — they unfold; a fold moves the caret onto the item first

Files:

- `src/webview/lib/fold.ts` — ours: children, the plugin
- `src/webview/components/ui/fold-node.tsx` — ours: chevron, hidden wrapper
- `src/webview/components/editor/plugins/fold-kit.tsx` — ours: the plugin, rendered
- `src/webview/components/editor/editor-kit.tsx` — `FoldKit`, after `DndKit`
- `tests/unit/fold.test.ts` — ours
