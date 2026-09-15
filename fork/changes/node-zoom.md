# node-zoom

A magnifier left of each block's grip, on hover — a top-level list item's left of its fold chevron. A press zooms in: back, reset and the block's
breadcrumb above it, then the block alone with what it holds — moved left by its indent, a child of the
bar. A crumb zooms in on it; back steps out one zoom, reset out of all. Upstream has no zoom.

The move is the text's alone: the gutter stays where it stands, so a deep zoom keeps its grip and
magnifier on the page — blocks drag and zoom in as outside one. Chevron and magnifier sit by the
indent the zoom shows.

What a block holds, off Plate's flat blocks: a heading ranks by its depth, any other block under
every heading by its indent — it holds the blocks after it ranked deeper. A zoom runs up to the
block that followed it, so a block typed inside stays in. The rest is hidden, never removed; select
all takes the zoom's blocks alone.

Files:

- `src/webview/lib/node-zoom.ts` — ours: outline, view, plugin, in/back/reset
- `src/webview/components/ui/node-zoom.tsx` — ours: the magnifier, the bar, hidden blocks, the move
- `src/webview/components/editor/plugins/node-zoom-kit.tsx` — ours
- `src/webview/components/editor/editor-kit.tsx` — the kit, after `DndKit` and `FoldKit`; the move, before `DndKit`
- `src/webview/components/ui/block-draggable.tsx` — the magnifier in the gutter
- `src/webview/components/ui/fold-node.tsx` — fold-chevrons': the chevron by the zoom's indent
- `tests/unit/node-zoom.test.ts` — ours
