# toolbar-right

The bar is a rail down the right edge, not a strip along the top. The three dots, the magnifier and
the bar's toggle stand in a column in the top right corner, the rail's buttons under them — undo,
redo, Turn into as the block type's icon, table, image, file, the text zoom at its foot. Tooltips and
menus open to the left. The find widget sits on the top line, left of the column.

Nothing holds the top line: the page starts there, a zoom's breadcrumb with it. Hidden, the rail
takes no room — the text runs under the column; shown, the page moves aside by its width. Upstream's
bar runs along the top, the page padded below it.

Files:

- `src/webview/components/ui/fixed-toolbar-right.tsx` — ours: the rail, its group, tooltips to the left
- `src/webview/components/editor/plugins/fixed-toolbar-kit.tsx` — the rail swapped in
- `src/webview/components/ui/fixed-toolbar-buttons-trimmed.tsx` — the buttons in a column
- `src/webview/components/app/appearance-menu.tsx` — the column; the menu to the left
- `src/webview/components/app/topbar-toggle.tsx` — the right panel's icons
- `src/webview/components/app/spotlight-button.tsx` — in the column
- `src/webview/components/ui/text-zoom-toolbar-buttons.tsx` — tooltips to the left
- `src/webview/components/ui/turn-into-toolbar-button.tsx` — the icon, not the label; to the left
- `src/webview/components/ui/table-toolbar-button.tsx` — to the left
- `src/webview/components/ui/media-toolbar-button.tsx` — to the left
- `src/webview/components/ui/toolbar-dropdown.tsx` — `side` passed on
- `src/webview/components/ui/find-replace.tsx` — on the top line, left of the column
- `src/index.css` — the rail hidden, the page moved aside, no top padding
