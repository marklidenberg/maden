// fork-add block-select

import { BlockSelectionPlugin } from '@platejs/selection/react';
import { createPlateEditor } from 'platejs/react';
import { describe, expect, it } from 'vitest';

import { BlockSelectPlugin, selectionGroups } from '../../src/webview/lib/block-select';

const block = (text: string, indent: number, list = true) => ({
  children: [{ text }],
  id: text,
  indent,
  ...(list && { listStyleType: 'disc' }),
  type: 'p',
});

const VALUE = [
  block('a', 1),
  block('b', 2),
  block('c', 3),
  block('p', 2, false),
  block('d', 1),
  block('e', 2),
  block('x', 0, false),
];

const createEditor = () =>
  createPlateEditor({
    plugins: [BlockSelectionPlugin, BlockSelectPlugin],
    value: structuredClone(VALUE),
  });

const selected = (editor: ReturnType<typeof createEditor>) => [
  ...editor.getOption(BlockSelectionPlugin, 'selectedIds')!,
];

describe('block select', () => {
  it('takes a list item with its children', () => {
    const editor = createEditor();
    const { blockSelection } = editor.getApi(BlockSelectionPlugin);

    blockSelection.set('a');
    expect(selected(editor)).toEqual(['a', 'b', 'c', 'p']);

    blockSelection.set('b');
    expect(selected(editor)).toEqual(['b', 'c']);

    blockSelection.add('d');
    expect(selected(editor)).toEqual(['b', 'c', 'd', 'e']);

    blockSelection.set(['p', 'x']);
    expect(selected(editor)).toEqual(['p', 'x']);
  });

  it('keeps a child while its list item stays', () => {
    const editor = createEditor();
    const { blockSelection } = editor.getApi(BlockSelectionPlugin);

    blockSelection.set('a');
    blockSelection.delete('c');
    expect(selected(editor)).toEqual(['a', 'b', 'p', 'c']);

    blockSelection.delete('a');
    expect(selected(editor)).toEqual(['b', 'p', 'c']);
  });

  it('takes the children once an area drag is released', () => {
    const editor = createEditor();
    const { blockSelection } = editor.getApi(BlockSelectionPlugin);

    blockSelection.set('d');
    editor.setOption(BlockSelectionPlugin, 'isSelectionAreaVisible', true);
    blockSelection.set(['a', 'd']);
    expect(selected(editor)).toEqual(['a', 'd']);

    blockSelection.delete('d');
    editor.setOption(BlockSelectionPlugin, 'isSelectionAreaVisible', false);
    expect(selected(editor)).toEqual(['a', 'b', 'c', 'p']);
  });

  it('draws a block and its selected children as one', () => {
    const groups = (ids: string[]) =>
      [...selectionGroups(VALUE, new Set(ids))].map(([id, covered]) => [
        id,
        covered.map((node) => node.id),
      ]);

    expect(groups(['a', 'b', 'c', 'p', 'd', 'x'])).toEqual([
      ['a', ['b', 'c', 'p']],
      ['d', []],
      ['x', []],
    ]);
    expect(groups(['a', 'b', 'p'])).toEqual([
      ['a', ['b']],
      ['p', []],
    ]);
  });
});

// end-fork-add block-select
