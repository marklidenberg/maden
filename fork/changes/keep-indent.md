# keep-indent

A line maden writes anew — edited, reverted, added — keeps the file's indentation; the rest of it in
maden's format. Upstream writes it at 2 spaces a level, beside siblings kept verbatim at another
indent: in a file of 4, the siblings after it nest under it.

- its siblings' indent — the nearest line at its depth, under the same parent
- else the one it had, where deeper than its parent — a code line in a fence aside, its indent is its own
- else a step of maden's under its parent

Files:

- `src/shared/keep-indent.ts` — ours
- `src/shared/markdown-format-reconcile.ts` — calls it over the diff
- `tests/unit/keep-indent.test.ts` — ours
