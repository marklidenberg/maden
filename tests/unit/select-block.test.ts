// fork-add select-block

import { BlockSelectionPlugin } from '@platejs/selection/react';
import { createPlateEditor } from 'platejs/react';
import { describe, expect, it } from 'vitest';

import { BlockSelectPlugin } from '../../src/webview/lib/block-select';
import { NodeZoomPlugin, zoomIn } from '../../src/webview/lib/node-zoom';
import { SelectBlockPlugin } from '../../src/webview/lib/select-block';

const block = (text: string, indent: number, list = true) => ({
  children: [{ text }],
  id: text,
  indent,
  ...(list && { listStyleType: 'disc' }),
  type: 'p',
});

// As in the editor kit: select-block after the zoom, wrapped outside it
const createEditor = () =>
  createPlateEditor({
    plugins: [BlockSelectionPlugin, BlockSelectPlugin, NodeZoomPlugin, SelectBlockPlugin],
    value: [
      block('a', 1),
      block('b', 2),
      block('c', 3),
      block('p', 2, false),
      block('d', 1),
      { children: [{ text: '' }], id: 'empty', type: 'p' },
    ],
  });

const selected = (editor: ReturnType<typeof createEditor>) => [
  ...editor.getOption(BlockSelectionPlugin, 'selectedIds')!,
];

const edges = (editor: ReturnType<typeof createEditor>) =>
  [editor.selection!.anchor, editor.selection!.focus].map(({ offset, path }) => [
    path[0],
    offset,
  ]);

describe('select block', () => {
  it('selects the text, then the block with its children', () => {
    const editor = createEditor();

    editor.tf.select({ offset: 0, path: [1, 0] });

    expect(editor.tf.selectAll()).toBe(true);
    expect(edges(editor)).toEqual([
      [1, 0],
      [1, 1],
    ]);
    expect(selected(editor)).toEqual([]);

    expect(editor.tf.selectAll()).toBe(true);
    expect(selected(editor)).toEqual(['b', 'c']);
  });

  it('selects an empty block at once', () => {
    const editor = createEditor();

    editor.tf.select({ offset: 0, path: [5, 0] });
    editor.tf.selectAll();

    expect(selected(editor)).toEqual(['empty']);
  });

  it('selects every block across blocks, or with no selection', () => {
    const editor = createEditor();
    const all = ['a', 'b', 'c', 'p', 'd', 'empty'];

    expect(editor.tf.selectAll()).toBe(true);
    expect(selected(editor)).toEqual(all);

    editor.getApi(BlockSelectionPlugin).blockSelection.deselect();
    editor.tf.select({ anchor: { offset: 0, path: [0, 0] }, focus: { offset: 1, path: [1, 0] } });

    expect(editor.tf.selectAll()).toBe(true);
    expect(selected(editor)).toEqual(all);
  });

  it('stays in a block in a zoom; across blocks, the zoom', () => {
    const editor = createEditor();

    zoomIn(editor, 'a');
    editor.tf.select({ offset: 0, path: [2, 0] });
    editor.tf.selectAll();
    expect(edges(editor)).toEqual([
      [2, 0],
      [2, 1],
    ]);

    editor.tf.select({ anchor: { offset: 0, path: [1, 0] }, focus: { offset: 1, path: [2, 0] } });
    editor.tf.selectAll();
    expect(edges(editor)).toEqual([
      [0, 0],
      [3, 1],
    ]);

    editor.tf.selectAll();
    expect(selected(editor)).toEqual(['a', 'b', 'c', 'p']);
  });
});

// end-fork-add select-block
