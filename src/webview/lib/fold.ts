// fork-add fold-chevrons

import type { SlateEditor, TElement } from 'platejs';

import { KEYS } from 'platejs';
import { createPlatePlugin } from 'platejs/react';

// A list item's children — the top-level blocks after it, indent deeper; a continuation paragraph too.
export type FoldIndex = {
  ancestors: Map<string, string[]>; // the list items a block sits under
  parents: Set<string>; // the list items with children
};

const indentOf = (node: TElement): number =>
  (node[KEYS.indent] as number | undefined) ?? 0;

export const buildFoldIndex = (nodes: TElement[]): FoldIndex => {
  const ancestors = new Map<string, string[]>();
  const parents = new Set<string>();
  const stack: { id: string; indent: number }[] = [];

  nodes.forEach((node) => {
    const indent = indentOf(node);

    while (stack.length > 0 && stack.at(-1)!.indent >= indent) stack.pop();

    if (stack.length > 0) parents.add(stack.at(-1)!.id);

    ancestors.set(node.id as string, stack.map(({ id }) => id));

    if (node[KEYS.listType]) stack.push({ id: node.id as string, indent });
  });

  return { ancestors, parents };
};

// The last child's index; the item's own where it has none.
export const lastChildIndex = (nodes: TElement[], index: number): number => {
  const indent = indentOf(nodes[index]);
  let last = index;

  while (last + 1 < nodes.length && indentOf(nodes[last + 1]) > indent) last++;

  return last;
};

// The caret inside folded children — its items unfold.
export const unfoldAtCaret = (editor: SlateEditor) => {
  const folded = editor.getOption(FoldPlugin, 'foldedIds');
  const index = editor.selection?.focus.path[0];
  const node = index === undefined ? undefined : editor.children[index];

  if (folded.size === 0 || !node) return;

  const ids = buildFoldIndex(editor.children).ancestors.get(node.id as string) ?? [];

  if (!ids.some((id) => folded.has(id))) return;

  editor.setOption(
    FoldPlugin,
    'foldedIds',
    new Set([...folded].filter((id) => !ids.includes(id)))
  );
};

// Folded ids live in the options, as upstream's toggle keeps `openIds` — the file untouched.
export const FoldPlugin = createPlatePlugin({
  key: 'fold',
  options: { foldedIds: new Set<string>() },
})
  .extendApi(({ editor, getOption, setOption }) => ({
    toggle: (id: string) => {
      const folded = new Set(getOption('foldedIds'));

      if (folded.delete(id)) return setOption('foldedIds', folded);

      const index = editor.children.findIndex((node) => node.id === id);
      const focus = editor.selection?.focus.path[0];

      if (index < 0) return;

      // The caret leaves the children first, or it would unfold them again.
      if (
        focus !== undefined &&
        focus > index &&
        focus <= lastChildIndex(editor.children, index)
      ) {
        editor.tf.select(editor.api.end([index])!);
      }

      setOption('foldedIds', folded.add(id));
    },
  }))
  // Enter on a folded item — the new item after its children, as upstream's toggle does.
  .overrideEditor(({ editor, getOption, tf: { insertBreak } }) => ({
    transforms: {
      insertBreak() {
        const index = editor.selection?.focus.path[0];
        const node = index === undefined ? undefined : editor.children[index];
        const last =
          node && getOption('foldedIds').has(node.id as string)
            ? lastChildIndex(editor.children, index!)
            : index;

        if (index === undefined || last === index) return insertBreak();

        editor.tf.withoutNormalizing(() => {
          const length = editor.children.length;

          insertBreak();

          if (editor.children.length > length) {
            editor.tf.moveNodes({ at: [index + 1], to: [last! + 1] });
          }
        });
      },
    },
  }))
  .extend({
    handlers: {
      onChange: ({ editor }) => unfoldAtCaret(editor),
    },
  });

// end-fork-add fold-chevrons
