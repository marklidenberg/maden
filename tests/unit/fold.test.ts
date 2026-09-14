// fork-add fold-chevrons

import { createPlateEditor } from 'platejs/react';
import { describe, expect, it } from 'vitest';

import { ListKit } from '../../src/webview/components/editor/plugins/list-kit';
import {
  buildFoldIndex,
  FoldPlugin,
  unfoldAtCaret,
} from '../../src/webview/lib/fold';
import { deserializeMarkdownToPlateValue } from '../../src/webview/lib/markdown-plate-conversion';

const block = (text: string, indent: number, list = true) => ({
  children: [{ text }],
  id: text,
  indent,
  ...(list && { listStyleType: 'disc' }),
  type: 'p',
});

const createEditor = (path: number[]) => {
  const point = { offset: 1, path };

  return createPlateEditor({
    plugins: [...ListKit, FoldPlugin],
    selection: { anchor: point, focus: point },
    value: [
      block('a', 1),
      block('b', 2),
      block('c', 3),
      block('p', 2, false),
      block('d', 1),
    ],
  });
};

const texts = (editor: ReturnType<typeof createEditor>) =>
  editor.children.map((node) => node.children[0].text);

const folded = (editor: ReturnType<typeof createEditor>) => [
  ...editor.getOption(FoldPlugin, 'foldedIds'),
];

describe('fold', () => {
  it('finds children, a continuation paragraph too', () => {
    const value = deserializeMarkdownToPlateValue(
      ['- a', '  - b', '    - c', '', '  more of a', '- d'].join('\n')
    ).value;
    const text = new Map(
      value.map((node) => [node.id as string, node.children[0].text as string])
    );
    const { ancestors, parents } = buildFoldIndex(value);

    expect([...parents].map((id) => text.get(id))).toEqual(['a', 'b']);
    expect(
      value.map((node) =>
        ancestors.get(node.id as string)!.map((id) => text.get(id))
      )
    ).toEqual([[], ['a'], ['a', 'b'], ['a'], []]);
  });

  it('folds and unfolds', () => {
    const editor = createEditor([4, 0]);
    const { fold } = editor.getApi(FoldPlugin);

    fold.toggle('a');
    expect(folded(editor)).toEqual(['a']);

    fold.toggle('a');
    expect(folded(editor)).toEqual([]);
  });

  it('moves the caret out of the children it folds', () => {
    const editor = createEditor([2, 0]);

    editor.getApi(FoldPlugin).fold.toggle('a');

    expect(editor.selection?.focus).toEqual({ offset: 1, path: [0, 0] });
  });

  it('unfolds where the caret lands', () => {
    const editor = createEditor([4, 0]);

    editor.getApi(FoldPlugin).fold.toggle('b');
    unfoldAtCaret(editor);
    expect(folded(editor)).toEqual(['b']);

    editor.tf.select({ offset: 0, path: [2, 0] });
    unfoldAtCaret(editor);
    expect(folded(editor)).toEqual([]);
  });

  it('opens the next item after the children of a folded one', () => {
    const editor = createEditor([0, 0]);

    editor.getApi(FoldPlugin).fold.toggle('a');
    editor.tf.insertBreak();

    expect(texts(editor)).toEqual(['a', 'b', 'c', 'p', '', 'd']);
    expect(editor.children[4]).toMatchObject({ indent: 1, listStyleType: 'disc' });
    expect(editor.selection?.focus.path).toEqual([4, 0]);
  });

  it('opens the next item in place for an unfolded one', () => {
    const editor = createEditor([0, 0]);

    editor.tf.insertBreak();

    expect(texts(editor)).toEqual(['a', '', 'b', 'c', 'p', 'd']);
  });
});

// end-fork-add fold-chevrons
