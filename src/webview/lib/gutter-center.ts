// fork-add gutter-center

// The middle of a block's first line, down from the top of `from` — in `from`'s own px, the text
// zoom undone. A void, or a block whose first line is another block's — none.
export const lineMiddle = (node: HTMLElement, from: HTMLElement): number | undefined => {
  if (node.dataset.slateVoid) return;

  const leaf = node.querySelector<HTMLElement>('[data-slate-leaf]');

  if (leaf?.closest('[data-slate-node="element"]:not([data-slate-inline])') !== node) return;

  const line = leaf.getClientRects()[0];
  const box = from.getBoundingClientRect();

  if (!line || !box.height) return;

  return ((line.top + line.height / 2 - box.top) * from.offsetHeight) / box.height;
};

// end-fork-add gutter-center
