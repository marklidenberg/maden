// fork-add block-select

import type { SlateEditor, TElement, Value } from 'platejs';

import { BlockSelectionPlugin } from '@platejs/selection/react';
import { KEYS } from 'platejs';
import { createPlatePlugin } from 'platejs/react';

import { lastChildIndex } from '@/lib/fold';

// A list item's last child — as a fold's; any other block, its own.
const lastOf = (children: Value, index: number): number =>
  children[index][KEYS.listType] ? lastChildIndex(children, index) : index;

// Every selected list item with its children.
export const withChildren = (children: Value, ids: Set<string>): Set<string> => {
  const next = new Set(ids);

  children.forEach((node, index) => {
    if (!ids.has(node.id as string)) return;

    for (let i = index + 1; i <= lastOf(children, index); i++) {
      next.add(children[i].id as string);
    }
  });

  return next;
};

let cached:
  | { children: Value; groups: Map<string, TElement[]>; ids: Set<string> | undefined }
  | undefined;

// Drawn as one: a selected block, by its id, and its selected children right after it.
export const selectionGroups = (
  children: Value,
  ids: Set<string> | undefined
): Map<string, TElement[]> => {
  if (cached?.children === children && cached.ids === ids) return cached.groups;

  const groups = new Map<string, TElement[]>();

  for (let index = 0; ids && index < children.length; index++) {
    if (!ids.has(children[index].id as string)) continue;

    const root = children[index];
    const last = lastOf(children, index);
    const covered: TElement[] = [];

    while (index < last && ids.has(children[index + 1].id as string)) {
      covered.push(children[++index]);
    }

    groups.set(root.id as string, covered);
  }

  cached = { children, groups, ids };

  return groups;
};

// Upstream writes `selectedIds` from many places — followed here, not at each. An area drag is
// settled once released: a list item it passed over and left would leave its children behind.
const followSelection = (editor: SlateEditor) => {
  const settle = () => {
    const { isSelectionAreaVisible, selectedIds } = editor.getOptions(BlockSelectionPlugin);

    if (isSelectionAreaVisible || !selectedIds) return;

    const next = withChildren(editor.children, selectedIds);

    if (next.size !== selectedIds.size) {
      editor.setOption(BlockSelectionPlugin, 'selectedIds', next);
    }
  };
  const store = editor.getOptionsStore(BlockSelectionPlugin);

  store.subscribe('selectedIds', settle);
  store.subscribe('isSelectionAreaVisible', settle);
};

export const BlockSelectPlugin = createPlatePlugin({
  key: 'blockSelect',
  extendEditor: ({ editor }) => {
    followSelection(editor);

    return editor;
  },
});

// end-fork-add block-select
