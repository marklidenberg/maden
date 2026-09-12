# markdown-no-escape

Markdown is saved as typed — `- [~]`, not `- \[~\]`; `-` bullets; tight lists. Upstream escapes
anything that could start a construct.

An escape stays only where its construct needs it — a table cell's `|`, a link's brackets.

- An edited line drops the source's escapes: `\# x` saves as `# x`, a heading on reopen. Unedited
  lines save as they were.
- `*` for emphasis — `_` cannot mark it inside a word.

Files:

- `src/webview/lib/markdown-serialize-options.ts` — ours
- `src/webview/components/editor/plugins/markdown-kit.tsx` — passes it
- `tests/unit/markdown-no-escape.test.ts` — ours
- `tests/unit/markdown-full-file-debug.test.ts` — `_` expectations to `*`
