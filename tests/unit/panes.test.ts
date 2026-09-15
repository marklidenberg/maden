// fork-add panes

import { NodeApi } from 'platejs';
import { createPlateEditor } from 'platejs/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FoldPlugin } from '../../src/webview/lib/fold';
import { deserializeMarkdownToPlateValue } from '../../src/webview/lib/markdown-plate-conversion';
import { getZoom, NodeZoomPlugin, zoomIn } from '../../src/webview/lib/node-zoom';
import {
  addPane,
  closePane,
  focusPane,
  forwardChange,
  initialPanes,
  movePane,
  PanePlugin,
  registerPane,
} from '../../src/webview/lib/panes';

const SOURCE = ['# Title', '', '- one', '  - two', '- three'].join('\n');

const createEditor = () =>
  createPlateEditor({
    plugins: [PanePlugin, NodeZoomPlugin, FoldPlugin],
    value: deserializeMarkdownToPlateValue(SOURCE).value,
  });

type Editor = ReturnType<typeof createEditor>;

const texts = (editor: Editor) => editor.children.map((node) => NodeApi.string(node));

const ids = (editor: Editor) => editor.children.map((node) => node.id);

// Slate's flush — the operations sent, then cleared
const flush = () => new Promise<void>((resolve) => setTimeout(resolve));

// The panes registered, each test's own
const registered: (() => void)[] = [];

const register = (id: string, editor: Editor, from?: string) =>
  registered.push(registerPane(id, editor, from));

afterEach(() => registered.splice(0).forEach((off) => off()));

// Two panes over one document, the second split off the first.
const createPanes = () => {
  const a = createEditor();
  const b = createEditor();

  register('a', a);
  register('b', b, 'a');

  return { a, b };
};

describe('panes', () => {
  it('opens with one pane, focused', () => {
    const state = initialPanes();

    expect(state.panes).toHaveLength(1);
    expect(state.focused).toBe(state.panes[0].id);
  });

  it('adds a pane under the focused one, split off it, focused', () => {
    const one = initialPanes();
    const two = addPane(one);
    const three = addPane(focusPane(two, one.focused));

    expect(two.panes.map((pane) => pane.from)).toEqual([undefined, one.focused]);
    expect(two.focused).toBe(two.panes[1].id);
    expect(three.panes.map((pane) => pane.id)).toEqual([
      one.focused,
      three.focused,
      two.focused,
    ]);
  });

  it('closes a pane, the focus onto the one above, else below; the last stays', () => {
    const three = addPane(addPane(initialPanes()));
    const [first, second, third] = three.panes.map((pane) => pane.id);

    expect(closePane(three, third).focused).toBe(second);
    expect(closePane(focusPane(three, first), first).focused).toBe(second);
    expect(closePane(three, second).panes.map((pane) => pane.id)).toEqual([first, third]);
    expect(closePane(three, second).focused).toBe(third);
    expect(closePane(initialPanes(), first).panes).toHaveLength(1);
  });

  it('moves a pane before another, or last', () => {
    const three = addPane(addPane(initialPanes()));
    const [first, second, third] = three.panes.map((pane) => pane.id);
    const order = (state: typeof three) => state.panes.map((pane) => pane.id);

    expect(order(movePane(three, first, 3))).toEqual([second, third, first]);
    expect(order(movePane(three, third, 0))).toEqual([third, first, second]);
    expect(order(movePane(three, first, 2))).toEqual([second, first, third]);
    expect(movePane(three, first, 1)).toBe(three);
  });
});

describe('one document across the panes', () => {
  it('seeds a pane from another, the ids and the view with it', () => {
    const a = createEditor();
    const b = createEditor();

    zoomIn(a, a.children[1].id as string);
    a.getApi(FoldPlugin).fold.toggle(a.children[1].id as string);
    register('a', a);
    register('b', b, 'a');

    expect(ids(b)).toEqual(ids(a));
    expect(texts(b)).toEqual(texts(a));
    expect(getZoom(b.getOption(NodeZoomPlugin, 'stack'))?.root).toBe(a.children[1].id);
    expect([...b.getOption(FoldPlugin, 'foldedIds')]).toEqual([a.children[1].id]);
    expect(b.history).toBe(a.history);
  });

  it('sends typing on, and nothing back', () => {
    const { a, b } = createPanes();

    a.tf.insertText('!', { at: a.api.end([3])! });
    forwardChange(a);

    expect(texts(b)).toEqual(['Title', 'one', 'two', 'three!']);

    const before = b.operations.length;

    forwardChange(b);

    expect(texts(a)).toEqual(['Title', 'one', 'two', 'three!']);
    expect(b.operations).toHaveLength(before);
  });

  it('keeps a split block under one id in both', () => {
    const { a, b } = createPanes();

    a.tf.select(a.api.end([1])!);
    a.tf.insertBreak();
    forwardChange(a);

    expect(texts(a)).toEqual(['Title', 'one', '', 'two', 'three']);
    expect(ids(b)).toEqual(ids(a));
  });

  it('undoes in one pane what was typed in another', async () => {
    const { a, b } = createPanes();

    a.tf.select(a.api.end([1])!);
    a.tf.insertText('!');
    forwardChange(a);
    await flush();
    b.tf.undo();
    forwardChange(b);
    await flush();

    expect(texts(a)).toEqual(['Title', 'one', 'two', 'three']);
    expect(texts(b)).toEqual(['Title', 'one', 'two', 'three']);

    a.tf.redo();
    forwardChange(a);

    expect(texts(b)).toEqual(['Title', 'one!', 'two', 'three']);
  });

  it('holds the caret of the other pane', () => {
    const { a, b } = createPanes();

    b.tf.select(b.api.end([3])!);
    a.tf.insertText('!!', { at: a.api.start([1])! });
    forwardChange(a);

    expect(b.selection?.focus).toEqual({ offset: 5, path: [3, 0] });
  });

  it('marks the focused pane', () => {
    const editor = createEditor();

    expect(editor.getOption(PanePlugin, 'focused')).toBe(true);
  });
});

// end-fork-add panes
