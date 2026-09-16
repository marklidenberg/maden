# fast-reload

A file changed from outside shows in the editor at once — a line changed in a long document, in
every pane, in a blink rather than seconds.

A text taken in the webview went in whole: Plate's `setValue` removes every block and puts every one
in again, an operation at a time — each dirtying paths, copying the tree, giving ids, normalizing the
lists after it. Time square to the blocks, in every pane, then the whole document rendered anew.
Upstream takes a host text in the one editor, rarely — dropped while the editor has focus.

The blocks are patched instead — `patchBlocks`: the blocks of the editor and those of the text,
aligned — the same head and tail, then the blocks alike in no other place, their longest run in order,
again between them. The paired blocks stand as they are, the nodes themselves — their render kept;
the rest removed and put in. A text of nothing — a paragraph, as `setValue` has it.

- the hearing pane — the text parsed afresh, its blocks read loose: the ids inside a block, the list's
  numbering, the empty leaves slate puts about an inline left out — none of them in a parse, all of
  them in the editor
- every other pane — the hearing pane's blocks to the letter

A block put in at the end costs the document written out whole: the list plugin asks slate for the
block after it, and slate's miss writes the whole document into its error. The patch gives slate a
scrubber writing nothing for the while — a document put in whole goes linear.

Files:

- `src/webview/lib/patch-blocks.ts` — ours
- `src/webview/lib/host-sync.ts` — edit-stability's: the text taken patched
- `src/webview/lib/panes.ts` — panes': `takeWhole` patched
- `tests/unit/fast-reload.test.ts` — ours
