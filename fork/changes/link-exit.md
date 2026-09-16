# link-exit

Text typed at a link's end lands after it, not inside. Upstream grows the link: Slate keeps the caret
at the end of the link's text.

- the caret at a link's end — moved past it, its marks kept
- anywhere else in a link — upstream's

Files:

- `src/webview/lib/link-exit.ts` — ours: `insertText` over the caret at a link's end
- `src/webview/components/editor/plugins/link-kit.tsx` — `LinkExitPlugin` after `LinkPlugin`
- `tests/unit/link-exit.test.ts` — ours
