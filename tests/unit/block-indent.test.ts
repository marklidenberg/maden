// fork-add block-indent

import { BlockSelectionPlugin } from '@platejs/selection/react';
import { createPlateEditor } from 'platejs/react';
import { describe, expect, it, vi } from 'vitest';

import { ListKit } from '../../src/webview/components/editor/plugins/list-kit';
import { indentSelected } from '../../src/webview/lib/block-indent';
import { BlockSelectPlugin } from '../../src/webview/lib/block-select';

const block = (text: string, indent: number, list = true) => ({
  children: [{ text }],
  id: text,
  indent,
  ...(list && { listStyleType: 'disc' }),
  type: 'p',
});

const createEditor = () =>
  createPlateEditor({
    plugins: [...ListKit, BlockSelectionPlugin, BlockSelectPlugin],
    value: [
      block('a', 1),
      block('b', 2),
      block('c', 3),
      block('p', 2, false),
      block('d', 1),
    ],
  });

const indents = (editor: ReturnType<typeof createEditor>) =>
  editor.children.map((node) => node.indent ?? 0);

const tab = (shiftKey = false) =>
  ({
    altKey: false,
    ctrlKey: false,
    key: 'Tab',
    keyCode: 9,
    metaKey: false,
    preventDefault: vi.fn(),
    shiftKey,
    which: 9,
  }) as unknown as KeyboardEvent;

describe('block indent', () => {
  it('moves a selected list item with its children', () => {
    const editor = createEditor();

    editor.getApi(BlockSelectionPlugin).blockSelection.set('a');

    const event = tab();

    indentSelected(editor, event);
    expect(indents(editor)).toEqual([2, 3, 4, 3, 1]);
    expect(event.preventDefault).toHaveBeenCalled();

    indentSelected(editor, tab(true));
    expect(indents(editor)).toEqual([1, 2, 3, 2, 1]);
  });

  it('moves the caret line alone', () => {
    const editor = createEditor();

    editor.tf.select(editor.api.start([0])!);
    editor.tf.tab({ reverse: false });
    expect(indents(editor)).toEqual([2, 2, 3, 2, 1]);
  });

  it('leaves Tab alone with nothing selected', () => {
    const editor = createEditor();
    const event = tab();

    indentSelected(editor, event);
    expect(indents(editor)).toEqual([1, 2, 3, 2, 1]);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});

// end-fork-add block-indent
