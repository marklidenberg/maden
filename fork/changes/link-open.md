# link-open

Pressing a link opens it.

Upstream leaves the press to the browser, and a browser follows no anchor inside `contenteditable` —
the caret lands in the link and the edit toolbar pops. A relative link cannot be pressed at all:
plate sanitizes `./notes.md` away, so the anchor carries no `href`.

The webview posts the link's raw url to the host; the host decides what it is and opens it — an
external url in the browser, a file in vscode.

Files:

- `src/webview/components/ui/link-node.tsx` — the region: `onClick` on the anchor
- `src/index.css` — the region: `cursor: pointer` on `.maden-link`
- `src/shared/messages.ts` — the region: `openLink` on `WebviewToHostMessage`
- `src/extension/MadenMarkdownEditorProvider.ts` — the regions: the import, the `openLink` branch
- `src/webview/lib/open-link.ts` — ours: posts to the host, `window.open` in browser mode
- `src/shared/link-target.ts` — ours: what a url points at — external, file, or nothing
- `src/extension/services/link-open.ts` — ours: the target opened
- `tests/unit/link-target.test.ts` — ours

`link-target.ts` is the allowlist: `http`, `https`, `mailto` and `tel` open externally, a path opens
as a file, everything else — `javascript:` and friends, a bare `#anchor` — opens nothing.

A press with a selection standing opens nothing — a drag across a link selects its text as ever.

The caret still lands in the link and the edit toolbar still shows; that is how a link stays
editable by mouse. The press now also opens it.
