# keep-indent

A line maden writes anew — edited, reverted, added, moved — keeps the file's indentation; the rest of
it in maden's format. Upstream writes it at 2 spaces a level, beside siblings kept verbatim at another
indent: in a file of 4, the siblings after it nest under it.

- its siblings' indent — the nearest line at its depth, under the same parent
- else the one it had, where deeper than its parent and at the same depth — a code line in a fence
  aside, its indent is its own
- else a step of the list under its parent — the nearest item and its parent item, as the file has
  them; maden's step where the list has none

A line moved to another depth — Tab, Shift+Tab — is not the line it was. Upstream matches lines
indent-blind: the move is not saved, the file goes stale, and the next edit takes its indent from the
stale one. Here a list item, and a line continuing its paragraph, carries its depth in the diff, and a
line given back with the file's formatting keeps its new indent where it stands at another depth.

Files:

- `src/shared/keep-indent.ts` — ours
- `src/shared/markdown-format-reconcile.ts` — marks the depths, calls it over the diff, keeps a moved
  line's indent
- `tests/unit/keep-indent.test.ts` — ours
