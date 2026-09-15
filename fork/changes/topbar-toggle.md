# topbar-toggle

The top bar starts hidden. A button in the top right corner shows and hides it; the three dots sit
just left of it. Upstream shows the bar, its toggle buried in the three dots.

Remembered in `localStorage`, as before — only the default flips.

Files:

- `src/webview/components/app/topbar-toggle.tsx` — ours: the button
- `src/webview/components/app/appearance-menu.tsx` — the button, right of the three dots
- `src/webview/App.tsx` — hidden by default
- `src/webview/components/ui/fixed-toolbar-buttons-trimmed.tsx` — the bar's buttons clear of both
