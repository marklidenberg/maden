// fork-add select-block

import { BlockSelectionPlugin } from '@platejs/selection/react';
import { RangeApi } from 'platejs';
import { createPlatePlugin } from 'platejs/react';

// Select all within one top-level block — its text, then the block, its children with it as
// block-select takes them. Across blocks, or none — a zoom's, else every block, never the browser's.
export const SelectBlockPlugin = createPlatePlugin({
  key: 'selectBlock',
}).overrideEditor(({ editor, tf: { selectAll } }) => ({
  transforms: {
    selectAll: () => {
      const { blockSelection } = editor.getApi(BlockSelectionPlugin);
      const edges = editor.selection && RangeApi.edges(editor.selection);

      if (!edges || edges[0].path[0] !== edges[1].path[0]) {
        if (!selectAll()) blockSelection.selectAll();

        return true;
      }

      const [start, end] = edges;
      const path = start.path.slice(0, 1);
      const node = editor.children[path[0]];

      if (!editor.api.isStart(start, path) || !editor.api.isEnd(end, path)) {
        editor.tf.select(path);
      } else if (blockSelection.isSelectable(node, path)) {
        blockSelection.set(node.id as string);
        blockSelection.focus();
      } else {
        return selectAll();
      }

      return true;
    },
  },
}));

// end-fork-add select-block
