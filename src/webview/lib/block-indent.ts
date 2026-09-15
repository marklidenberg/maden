// fork-add block-indent

import type { SlateEditor } from 'platejs';

import { indent, outdent } from '@platejs/indent';
import { BlockSelectionPlugin } from '@platejs/selection/react';
import { getInjectMatch, isHotkey, KEYS } from 'platejs';

// Tab over selected blocks — each moved as the caret's line is; a list item's children with it, as
// block-select took them. The focus stays in the editor.
export const indentSelected = (editor: SlateEditor, event: KeyboardEvent) => {
  const reverse = isHotkey('shift+tab')(event);
  const ids = editor.getOption(BlockSelectionPlugin, 'selectedIds');

  if ((!reverse && !isHotkey('tab')(event)) || !ids?.size) return;

  event.preventDefault();

  if (editor.api.isReadOnly()) return;

  const match = getInjectMatch(editor, editor.getPlugin({ key: KEYS.indent }));

  (reverse ? outdent : indent)(editor, {
    getNodesOptions: {
      at: [],
      match: (node, path) => ids.has(node.id as string) && match(node, path),
    },
  });
};

// end-fork-add block-indent
