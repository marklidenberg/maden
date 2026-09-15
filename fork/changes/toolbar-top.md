# toolbar-top

The bar is a row at the top of the page, centered, not a strip along the top edge: the three dots,
the magnifier, the bar's toggle and the plus, then the focused pane's buttons — undo, redo, Turn
into as the block type's icon, table, image, file, the text zoom. It stands in the page's flow, so it
scrolls away with the text; upstream's is fixed over the page, the page padded below it.

Each pane's editor renders the bar; the focused pane's sends its buttons into the row's slot, an
unfocused pane's renders nothing. Hidden with the toggle, the row keeps the singletons alone. The
find widget sits in the top right corner.

Files:

- `src/webview/lib/toolbar-top.ts` — ours: the slot, a store
- `src/webview/components/ui/fixed-toolbar-top.tsx` — ours: the focused pane's bar, sent to the slot
- `src/webview/components/editor/plugins/fixed-toolbar-kit.tsx` — the bar swapped in
- `src/webview/components/ui/fixed-toolbar-buttons-trimmed.tsx` — the buttons in a row
- `src/webview/components/app/appearance-menu.tsx` — the row; the slot at its end
- `src/webview/components/app/spotlight-button.tsx` — in the row
- `src/webview/components/ui/turn-into-toolbar-button.tsx` — the icon, not the label
- `src/index.css` — the bar hidden; the page's top padding
