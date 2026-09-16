// fork-add edit-stability

import { NodeApi, type Value } from 'platejs';
import { createPlateEditor } from 'platejs/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MarkdownConversionKit } from '../../src/webview/components/editor/markdown-conversion-kit';
import {
  connectHost,
  type DocumentChanged,
  HostSyncPlugin,
  resetHostSync,
  sendEdit,
  takeHostText,
} from '../../src/webview/lib/host-sync';
import {
  deserializeMarkdownToPlateValue,
  EMPTY_VALUE,
} from '../../src/webview/lib/markdown-plate-conversion';
import {
  forwardChange,
  HistoryGuardPlugin,
  holdsDocument,
  PanePlugin,
  registerPane,
} from '../../src/webview/lib/panes';

const SOURCE = ['# Title', '', 'one', '', 'two', '', 'three'].join('\n');

const createEditor = (value: Value = EMPTY_VALUE) =>
  createPlateEditor({
    plugins: [...MarkdownConversionKit, PanePlugin, HostSyncPlugin, HistoryGuardPlugin],
    value: structuredClone(value),
  });

type Editor = ReturnType<typeof createEditor>;

const texts = (editor: Editor) => editor.children.map((node) => NodeApi.string(node));

const hostText = (markdown: string, more: { external?: boolean; revision?: number } = {}) => ({
  fileName: 'note',
  filePath: '/note.md',
  markdown,
  revision: 0,
  ...more,
});

const posted: DocumentChanged[] = [];

connectHost((message) => posted.push(message));

const registered: (() => void)[] = [];

const register = (id: string, editor: Editor) => registered.push(registerPane(id, editor));

afterEach(() => {
  registered.splice(0).forEach((off) => off());
  posted.splice(0);
  resetHostSync();
  vi.restoreAllMocks();
});

// A pane opened on the host's text, typed in
const openTyped = () => {
  const a = createEditor();

  register('a', a);
  takeHostText(a, hostText(SOURCE));
  a.tf.insertText('!', { at: a.api.end([1])! });
  sendEdit(a);

  return a;
};

describe('the host text', () => {
  it('opens on it, and holds it', () => {
    const a = createEditor();

    register('a', a);

    expect(holdsDocument(a)).toBe(false);

    takeHostText(a, hostText(SOURCE));

    expect(texts(a)).toEqual(['Title', 'one', 'two', 'three']);
    expect(holdsDocument(a)).toBe(true);
    expect(posted).toEqual([]);
  });

  it('sends typing, on the revision heard', () => {
    openTyped();

    expect(posted).toHaveLength(1);
    expect(posted[0].markdown).toContain('one!');
    expect(posted[0].revision).toBe(0);
  });

  it('takes no echo of an older write over newer typing', () => {
    const a = openTyped();

    a.tf.insertText('?', { at: a.api.end([2])! });
    sendEdit(a);
    takeHostText(a, hostText(SOURCE.replace('one', 'one!')));

    expect(texts(a)).toEqual(['Title', 'one!', 'two?', 'three']);
  });

  it('takes a change from outside, and a newer revision', () => {
    const a = openTyped();

    takeHostText(a, hostText(SOURCE.replace('three', 'outside'), { external: true }));

    expect(texts(a)).toEqual(['Title', 'one', 'two', 'outside']);

    takeHostText(a, hostText(SOURCE.replace('two', 'newer'), { revision: 1 }));

    expect(texts(a)).toEqual(['Title', 'one', 'newer', 'three']);

    a.tf.insertText('!', { at: a.api.end([3])! });
    sendEdit(a);

    expect(posted.at(-1)?.revision).toBe(1);
  });

  it('sends nothing from an editor holding nothing', () => {
    const a = createEditor();

    register('a', a);
    a.tf.insertText('lost', { at: a.api.end([0])! });
    sendEdit(a);

    expect(posted).toEqual([]);
  });

  it('opens an editor made afresh on the text held since, not the one first heard', () => {
    openTyped();
    registered.splice(0).forEach((off) => off());

    const fresh = createEditor();

    register('fresh', fresh);
    takeHostText(fresh, hostText(SOURCE));

    expect(texts(fresh)).toEqual(['Title', 'one!', 'two', 'three']);
    expect(holdsDocument(fresh)).toBe(true);
  });
});

describe('across the panes', () => {
  it('takes the host text once, and sends from any pane', () => {
    const a = createEditor();
    const b = createEditor();

    register('a', a);
    register('b', b);
    takeHostText(a, hostText(SOURCE));
    takeHostText(b, hostText(SOURCE));

    expect(texts(b)).toEqual(['Title', 'one', 'two', 'three']);
    expect(holdsDocument(b)).toBe(true);

    b.tf.insertText('!', { at: b.api.end([3])! });
    forwardChange(b);
    sendEdit(b);

    expect(texts(a)).toEqual(['Title', 'one', 'two', 'three!']);
    expect(posted.at(-1)?.markdown).toContain('three!');
  });

  it('gives a pane gone apart the whole document again', () => {
    const a = createEditor(deserializeMarkdownToPlateValue(SOURCE).value);
    const b = createEditor();

    register('a', a);
    register('b', b);
    b.tf.withoutSaving(() => b.tf.insertText('stray', { at: b.api.end([1])! }));
    a.tf.insertText('!', { at: a.api.end([2])! });
    forwardChange(a);

    expect(texts(b)).toEqual(texts(a));
    expect(b.children.map((node) => node.id)).toEqual(a.children.map((node) => node.id));
  });
  // fork-add session

  it('forwards nothing a pane did before it took the whole document', () => {
    const a = createEditor();

    register('a', a);
    takeHostText(a, hostText(SOURCE));

    const b = createEditor();
    const children = a.children;

    b.tf.setNodes({ id: 'opened-on-nothing' }, { at: [0] });
    register('b', b);
    forwardChange(b);

    expect(a.children).toBe(children);
    expect(b.children.map((node) => node.id)).toEqual(a.children.map((node) => node.id));
  });

  // end-fork-add session
});

describe('the history', () => {
  it('forgets the text replaced from outside', () => {
    const a = openTyped();

    expect(a.history.undos.length).toBeGreaterThan(0);

    takeHostText(a, hostText(SOURCE.replace('three', 'outside'), { external: true }));

    expect(a.history.undos).toEqual([]);

    a.tf.undo();

    expect(texts(a)).toEqual(['Title', 'one', 'two', 'outside']);
  });

  it('puts the document back where an undo will not apply', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const a = openTyped();
    const before = texts(a);

    a.history.undos.push({
      operations: [{ node: { children: [{ text: '' }], type: 'p' }, path: [99], type: 'remove_node' }],
      selectionBefore: null,
    });
    a.tf.undo();

    expect(texts(a)).toEqual(before);
    expect(a.history.undos).toEqual([]);
  });
});

// end-fork-add edit-stability
