# fold-state

A file reloaded from outside keeps its folds. Upstream builds a reload anew, every block a fresh id;
folds hold by ids, so all of them opened.

The blocks a reload leaves standing keep their ids — old paired with new, in order, by a diff:

- equal blocks — first
- blocks of one shape, type, indent and list — the likest text; an item edited in place stays itself
- the rest — new; so is the middle of a change past a million cells

The caret moves with its block — left at its path, it could land in folded children and unfold
them. Zooms and toggles hold by ids too, and stay.

Files:

- `src/webview/lib/keep-blocks.ts` — ours: pairs, ids, the selection
- `src/webview/lib/host-sync.ts` — edit-stability's: ids carried before the value is set; the caret
  put back through them
- `tests/unit/fold-state.test.ts` — ours
