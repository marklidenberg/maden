# link-open

Pressing a link opens it — a url in the browser, a file in vscode — and leaves the caret where it is.
Upstream only drops the caret in: `contenteditable` follows no anchor, and plate strips a relative
`href`.

The caret stays because `mousedown` is cancelled; a drag started on a link selects nothing.

`http`, `https`, `mailto`, `tel`, `vscode`, `vscode-insiders` open externally — vscode hands its own
scheme to the extension's uri handler; a path opens as a file; anything else — nothing.

Files:

- `src/webview/components/ui/link-node.tsx` — `onClick`
- `src/index.css` — `cursor: pointer`
- `src/shared/messages.ts` — `openLink`
- `src/extension/MadenMarkdownEditorProvider.ts` — its handler
- `src/webview/lib/open-link.ts` — ours
- `src/shared/link-target.ts` — ours
- `src/extension/services/link-open.ts` — ours
- `tests/unit/link-target.test.ts` — ours
