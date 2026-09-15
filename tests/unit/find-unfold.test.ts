// fork-add find-unfold

import { createPlateEditor } from 'platejs/react';
import { describe, expect, it } from 'vitest';

import { ListKit } from '../../src/webview/components/editor/plugins/list-kit';
import { findStep, FindReplacePlugin, setFindQuery } from '../../src/webview/lib/find-replace';
import { FoldPlugin } from '../../src/webview/lib/fold';

const item = (id: string, text: string, indent: number) => ({
  children: [{ text }],
  id,
  indent,
  listStyleType: 'disc',
  type: 'p',
});

const createEditor = () => {
  const editor = createPlateEditor({
    plugins: [...ListKit, FoldPlugin, FindReplacePlugin],
    value: [
      item('a', 'a', 1),
      item('b', 'b x', 2),
      item('c', 'c x', 3),
      item('d', 'd x', 1),
      item('e', 'e', 2),
      item('f', 'f x', 3),
    ],
  });

  editor.setOption(FoldPlugin, 'foldedIds', new Set(['a', 'b', 'e']));

  return editor;
};

const folded = (editor: ReturnType<typeof createEditor>) => [
  ...editor.getOption(FoldPlugin, 'foldedIds'),
];

describe('find unfold', () => {
  it('unfolds the folds over the current match, step by step', () => {
    const editor = createEditor();

    setFindQuery(editor, { open: true, search: 'x' });
    expect(folded(editor)).toEqual(['b', 'e']);

    findStep(editor, 1);
    expect(folded(editor)).toEqual(['e']);

    findStep(editor, 1);
    expect(folded(editor)).toEqual(['e']);

    findStep(editor, 1);
    expect(folded(editor)).toEqual([]);
  });

  it('leaves the folds while closed', () => {
    const editor = createEditor();

    setFindQuery(editor, { search: 'x' });
    expect(folded(editor)).toEqual(['a', 'b', 'e']);
  });
});

// end-fork-add find-unfold
