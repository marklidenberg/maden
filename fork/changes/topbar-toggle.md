# topbar-toggle

The bar starts hidden. A button in the row at the top shows and hides it, after the three dots.
Upstream shows the bar, its toggle buried in the three dots.

Remembered in `localStorage`, as before — only the default flips.

Files:

- `src/webview/components/app/topbar-toggle.tsx` — ours: the button
- `src/webview/components/app/appearance-menu.tsx` — the button, after the three dots
- `src/webview/App.tsx` — hidden by default
