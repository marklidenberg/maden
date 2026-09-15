# spotlight

A search over every bullet of the file, opened by a magnifier between the three dots and the bar's
toggle, or by `Maden: Spotlight` — `ctrl+p`, `cmd+p` on a mac, taken from VS Code's quick open
while a Maden tab holds the focus. Empty,
it lists the recent bullets — zoomed into or typed in, the latest first, scrolled; typed, a fuzzy
search — each word of the query a subsequence, runs and word starts first. Arrows move, enter picks,
`ctrl+p` again steps down. A pick zooms in on the bullet, the caret at its end, a fold over it
opened. Upstream has no search over bullets.

A bullet is a top-level list item with text, its breadcrumb the zoom's. Recents are kept per file
in the webview's local storage, by text — by id while the editor lives.

The overlay is a plain `div`, not Radix's: its scroll lock sets the body's padding to its margin —
VS Code's `padding: 0 20px` gone, the page shifted. The editor scrolls in its own container.

Files:

- `src/webview/lib/spotlight.ts` — ours: bullets, fuzzy match, recents, plugin, jump
- `src/webview/components/ui/spotlight.tsx` — ours: the dialog
- `src/webview/components/editor/plugins/spotlight-kit.tsx` — ours
- `src/webview/components/app/spotlight-button.tsx` — ours: the magnifier
- `src/webview/components/editor/editor-kit.tsx` — the kit, after `NodeZoomKit`
- `src/webview/components/app/appearance-menu.tsx` — the magnifier, before the bar's toggle
- `src/extension/services/spotlight.ts` — ours: `maden.spotlight`, sent to the active panel
- `src/extension/extension.ts` — the command registered
- `src/extension/MadenMarkdownEditorProvider.ts` — each panel tracked
- `src/shared/messages.ts` — `openSpotlight`
- `package.json` — the command, `ctrl+p`, `cmd+p` on a mac, the palette entry
- `tests/unit/spotlight.test.ts` — ours
