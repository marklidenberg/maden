# markdown-angle-text

A `<` that opens no tag — `<name>` never closed, `<-` — is text; it is kept, and the rest after it.
Upstream hands it to MDX, which throws; Plate's fallback cuts the document there.

On open it is escaped to `&lt;`; `markdown-no-escape` saves it back as `<`. Closed tags, void html,
comments, code and link destinations are left alone — code spans by upstream's placeholder escape too.

Files:

- `src/webview/lib/markdown-angle-text.ts` — ours
- `src/webview/lib/markdown-open-normalize.ts` — calls it
- `tests/unit/markdown-angle-text.test.ts` — ours
