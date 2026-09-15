// fork-add block-paste

import type { SlateEditor, TElement } from 'platejs';

import { createPlateEditor } from 'platejs/react';
import { describe, expect, it } from 'vitest';

import { ListKit } from '../../src/webview/components/editor/plugins/list-kit';
import {
  BLOCKS_TYPE,
  copyBlocks,
  lastSelectedRoot,
  pasteBlocks,
  rebaseIndent,
} from '../../src/webview/lib/block-paste';
import { createMarkdownConversionEditor } from '../../src/webview/lib/markdown-plate-conversion';

const block = (text: string, indent: number, list = true): TElement => ({
  children: [{ text }],
  id: text,
  indent,
  ...(list && { listStyleType: 'disc' }),
  type: 'p',
});

const copied = () => [block('b', 2), block('c', 3)];

// - a
//   - b
//     - c
// - d
//   - e
// (empty paragraph)
const createEditor = () =>
  createPlateEditor({
    nodeId: true,
    plugins: ListKit,
    value: [
      block('a', 1),
      block('b', 2),
      block('c', 3),
      block('d', 1),
      block('e', 2),
      { children: [{ text: '' }], id: 'empty', type: 'p' },
    ],
  }) as unknown as SlateEditor;

const shape = (editor: SlateEditor) =>
  editor.children.map((node) => [
    (node.children[0] as { text: string }).text,
    (node.indent as number | undefined) ?? 0,
  ]);

describe('rebaseIndent', () => {
  it('keeps the relative indent, the shallowest on the base', () => {
    expect(rebaseIndent(copied(), 4).map((node) => node.indent)).toEqual([4, 5]);
  });

  it('never puts a list item under 1', () => {
    expect(rebaseIndent(copied(), 0).map((node) => node.indent)).toEqual([1, 2]);
    expect(
      rebaseIndent([block('p', 1, false), block('q', 1)], 0).map((node) => node.indent)
    ).toEqual([1, 1]);
  });

  it('drops a zero indent off a plain block', () => {
    expect(rebaseIndent([block('p', 2, false)], 0)[0]).not.toHaveProperty('indent');
  });
});

describe('pasteBlocks', () => {
  it('pastes after the caret block, at its indent', () => {
    const editor = createEditor();

    expect(pasteBlocks(editor, copied(), 4)).toEqual([5, 6]);
    expect(shape(editor)).toEqual([
      ['a', 1],
      ['b', 2],
      ['c', 3],
      ['d', 1],
      ['e', 2],
      ['b', 2],
      ['c', 3],
      ['', 0],
    ]);
  });

  it('pastes after a list item’s children', () => {
    const editor = createEditor();

    expect(pasteBlocks(editor, copied(), 0)).toEqual([3, 4]);
    expect(shape(editor).slice(0, 6)).toEqual([
      ['a', 1],
      ['b', 2],
      ['c', 3],
      ['b', 1],
      ['c', 2],
      ['d', 1],
    ]);
  });

  it('replaces an empty block', () => {
    const editor = createEditor();

    expect(pasteBlocks(editor, copied(), 5)).toEqual([5, 6]);
    expect(shape(editor).slice(4)).toEqual([
      ['e', 2],
      ['b', 1],
      ['c', 2],
    ]);
  });

  it('gives the pasted fresh ids', () => {
    const editor = createEditor();

    pasteBlocks(editor, copied(), 4);

    const ids = editor.children.map((node) => node.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('lastSelectedRoot', () => {
  it('is the last selected block not a child of one before it', () => {
    const { children } = createEditor();

    expect(lastSelectedRoot(children, new Set(['a', 'b', 'c']))).toBe(0);
    expect(lastSelectedRoot(children, new Set(['b', 'c', 'd', 'e']))).toBe(3);
    expect(lastSelectedRoot(children, new Set(['c']))).toBe(2);
    expect(lastSelectedRoot(children, new Set())).toBeUndefined();
  });
});

describe('copyBlocks', () => {
  it('writes the blocks, and markdown from the top', () => {
    const data = new Map<string, string>();

    copyBlocks(
      createMarkdownConversionEditor() as never,
      { setData: (type: string, value: string) => data.set(type, value) } as unknown as DataTransfer,
      copied()
    );

    expect(JSON.parse(data.get(BLOCKS_TYPE)!)).toEqual(copied());
    expect(data.get('text/plain')).toBe('- b\n  - c');
    expect(data.get('text/markdown')).toBe('- b\n  - c');
  });
});

// end-fork-add block-paste
