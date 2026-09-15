# text-zoom

The bar's foot makes the text smaller or larger; the percentage between the two buttons
resets it. Upstream has no zoom.

A step is CSS `zoom` on each top-level block — text, boxes and images alike — so the page's padding
stays clear of the bar. Steps run 50%–200%, as a browser's. Remembered in `localStorage`, as the
other appearance settings are.

Files:

- `src/webview/lib/text-zoom.ts` — ours: steps
- `src/webview/components/ui/text-zoom-toolbar-buttons.tsx` — ours: the buttons
- `src/webview/components/ui/fixed-toolbar-buttons-trimmed.tsx` — the buttons on the bar
- `src/index.css` — the zoom
- `tests/unit/text-zoom.test.ts` — ours
