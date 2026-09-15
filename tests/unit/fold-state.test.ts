// fork-add fold-state

import { createPlateEditor } from 'platejs/react';
import { describe, expect, it } from 'vitest';

import { ListKit } from '../../src/webview/components/editor/plugins/list-kit';
import { FoldPlugin, unfoldAtCaret } from '../../src/webview/lib/fold';
import { keepBlocks, pairBlocks } from '../../src/webview/lib/keep-blocks';
import { keepSelection } from '../../src/webview/lib/keep-selection';
import { deserializeMarkdownToPlateValue } from '../../src/webview/lib/markdown-plate-conversion';

const read = (lines: string[]) => deserializeMarkdownToPlateValue(lines.join('\n')).value;

describe('pairBlocks', () => {
  it('pairs equal blocks around a new one', () => {
    expect(pairBlocks(read(['- a', '- b', '- c']), read(['- a', '- new', '- b', '- c']))).toEqual([
      [0, 0],
      [1, 2],
      [2, 3],
    ]);
  });

  it('pairs a block edited in place', () => {
    expect(pairBlocks(read(['- a', '  - b', '- c']), read(['- a edited', '  - b', '- c']))).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
    ]);
  });

  it('pairs an edited block past a new one of another shape', () => {
    expect(
      pairBlocks(read(['- a', '- g', '- d']), read(['- a', '  - new', '- g edited', '- d']))
    ).toEqual([
      [0, 0],
      [1, 2],
      [2, 3],
    ]);
  });

  it('pairs an edited block with the likest of one shape', () => {
    expect(pairBlocks(read(['- a', '- b']), read(['- new', '- a edited', '- b']))).toEqual([
      [0, 1],
      [1, 2],
    ]);
  });
});

describe('keepBlocks', () => {
  it('keeps a fold and the caret through a reload', () => {
    const editor = createPlateEditor({
      plugins: [...ListKit, FoldPlugin],
      value: read(['- a', '  - b', '- c']),
    });
    const [a, , c] = editor.children;

    editor.tf.select({ offset: 1, path: [2, 0] });
    editor.getApi(FoldPlugin).fold.toggle(a.id as string);

    const next = read(['- new', '- a edited', '  - b', '- c']);
    const selection = keepBlocks(editor.children, next, editor.selection);

    editor.tf.setValue(next);
    keepSelection(editor, selection);
    unfoldAtCaret(editor);

    expect(editor.children.map((node) => node.id)).toEqual([
      expect.any(String),
      a.id,
      expect.any(String),
      c.id,
    ]);
    expect(editor.selection?.focus).toEqual({ offset: 1, path: [3, 0] });
    expect([...editor.getOption(FoldPlugin, 'foldedIds')]).toEqual([a.id]);
  });
});

// end-fork-add fold-state
