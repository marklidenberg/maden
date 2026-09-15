# gutter-center

A block's gutter — the magnifier, the grip, a list item's fold chevron — centered on its first line,
as its marker and text are: whatever the theme, the text zoom, the block's padding. Upstream places
the grip by the block's top margin, a fixed 3px down — a line padded or sized otherwise leaves it
high. A void, or a block its first line is another's, keeps upstream's.

Files:

- `src/webview/lib/gutter-center.ts` — ours: the first line's middle
- `src/webview/components/ui/block-draggable.tsx` — the grip's and the magnifier's top
- `src/webview/components/ui/fold-node.tsx` — fold-chevrons': the chevron's top
