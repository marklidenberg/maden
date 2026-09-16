// fork-add external-reload

import { afterEach, describe, expect, it } from 'vitest';

import { NodeApi } from 'platejs';
import { createPlateEditor } from 'platejs/react';

import {
  createFileWriter,
  markExternal,
  readExternalText,
  withRevision,
} from '../../src/extension/services/external-reload';
import { keepSelection } from '../../src/webview/lib/keep-selection';
import { deserializeMarkdownToPlateValue } from '../../src/webview/lib/markdown-plate-conversion';
import { forwardChange, PanePlugin, registerPane, takeDocument } from '../../src/webview/lib/panes';

const paragraph = (text: string) => ({ children: [{ text }], type: 'p' });

const unseen = () => undefined;

describe('readExternalText', () => {
  it('takes a text other than the one held', async () => {
    const text = await readExternalText({
      held: () => 'mine',
      read: async () => 'theirs',
      seen: unseen,
      writes: () => 0,
      writing: () => false,
    });

    expect(text).toBe('theirs');
  });

  it('skips the text held — an echo', async () => {
    const text = await readExternalText({
      held: () => 'mine',
      read: async () => 'mine',
      seen: unseen,
      writes: () => 0,
      writing: () => false,
    });

    expect(text).toBeUndefined();
  });

  it('skips while a host write is in flight, unread', async () => {
    let reads = 0;
    const text = await readExternalText({
      held: () => 'mine',
      read: async () => {
        reads += 1;
        return 'stale';
      },
      seen: unseen,
      writes: () => 0,
      writing: () => true,
    });

    expect(text).toBeUndefined();
    expect(reads).toBe(0);
  });

  it('skips a read a host write began and finished during', async () => {
    let writes = 0;
    let held = 'first';
    const text = await readExternalText({
      held: () => held,
      read: async () => {
        held = 'second';
        writes += 1;
        return 'first-on-disk-before';
      },
      seen: unseen,
      writes: () => writes,
      writing: () => false,
    });

    expect(text).toBeUndefined();
  });

  it('skips a read a host write is still in flight after', async () => {
    let writing = false;
    const text = await readExternalText({
      held: () => 'mine',
      read: async () => {
        writing = true;
        return 'stale';
      },
      seen: unseen,
      writes: () => 0,
      writing: () => writing,
    });

    expect(text).toBeUndefined();
  });

  it('marks the file seen on a read no host write overlapped', async () => {
    const seen: string[] = [];
    const read = async () => 'mine';

    await readExternalText({ held: () => 'mine', read, seen: (text) => seen.push(text), writes: () => 0, writing: () => false });
    await readExternalText({ held: () => 'mine', read, seen: (text) => seen.push(text), writes: () => 0, writing: () => true });

    expect(seen).toEqual(['mine']);
  });
});

describe('createFileWriter', () => {
  const fileOf = (text: string | undefined) => {
    const file = { text, writes: 0 };
    const writer = createFileWriter({
      read: async () => file.text,
      write: async (next) => {
        await Promise.resolve();
        file.text = next;
        file.writes += 1;
      },
    });

    return { file, writer };
  };

  it('writes no old copy over a change from outside the event of which a host write skipped', async () => {
    const before = '- [ ] a\n- [ ] vscode-settings-sync\n';
    const after = '- [ ] a\n';
    const { file, writer } = fileOf(before);
    writer.seen(before);

    // - Outside: the node removed

    file.text = after;

    // - The webview's pending write, built on the text before, flushes

    let writing = 1;
    const write = writer.write(before);

    // - The watcher's event comes during it — skipped

    const external = await readExternalText({
      held: () => before,
      read: async () => file.text ?? '',
      seen: writer.seen,
      writes: () => 0,
      writing: () => writing > 0,
    });

    const moved = await write;
    writing -= 1;

    expect(external).toBeUndefined();
    expect(moved).toBe(after);
    expect(file.text).toBe(after);
  });

  it('writes over the text last seen', async () => {
    const { file, writer } = fileOf('mine');
    writer.seen('mine');

    expect(await writer.write('mine, edited')).toBeUndefined();
    expect(file.text).toBe('mine, edited');
  });

  it('writes nothing where the text is there already', async () => {
    const { file, writer } = fileOf('theirs');
    writer.seen('mine');

    expect(await writer.write('theirs')).toBeUndefined();
    expect(file.writes).toBe(0);
  });

  it('takes its own writes in turn, none read as a change from outside', async () => {
    const { file, writer } = fileOf('mine');
    writer.seen('mine');

    const moved = await Promise.all([writer.write('mine 1'), writer.write('mine 2')]);

    expect(moved).toEqual([undefined, undefined]);
    expect(file.text).toBe('mine 2');
  });

  it('writes a file gone, or one never seen, anew', async () => {
    const gone = fileOf(undefined);
    gone.writer.seen('mine');

    const never = fileOf('theirs');

    expect(await gone.writer.write('mine')).toBeUndefined();
    expect(await never.writer.write('mine')).toBeUndefined();
    expect([gone.file.text, never.file.text]).toEqual(['mine', 'mine']);
  });
});

describe('markExternal', () => {
  it('marks an external document update alone', () => {
    const update = {
      aiEnabled: false,
      fileName: 'note',
      filePath: '/note.md',
      markdown: '# note',
      readOnly: false,
      type: 'externalDocumentUpdated' as const,
      workspacePaths: [],
    };

    expect(markExternal(update)).toEqual({ ...update, external: true });
    expect(markExternal({ readOnly: true, type: 'setReadonly' })).toEqual({
      readOnly: true,
      type: 'setReadonly',
    });
  });
});

describe('withRevision', () => {
  it('gives the revision to a document text alone', () => {
    const init = {
      aiEnabled: false,
      fileName: 'note',
      filePath: '/note.md',
      markdown: '# note',
      readOnly: false,
      type: 'initDocument' as const,
      workspacePaths: [],
    };

    expect(withRevision(init, 2)).toEqual({ ...init, revision: 2 });
    expect(withRevision({ ...init, type: 'externalDocumentUpdated' }, 3)).toEqual({
      ...init,
      revision: 3,
      type: 'externalDocumentUpdated',
    });
    expect(withRevision({ readOnly: true, type: 'setReadonly' }, 2)).toEqual({
      readOnly: true,
      type: 'setReadonly',
    });
  });
});

describe('keepSelection', () => {
  it('keeps the caret on its text, the offset clamped', () => {
    const editor = createPlateEditor({ value: [paragraph('hello world'), paragraph('second line')] });
    editor.tf.select({ anchor: { offset: 9, path: [1, 0] }, focus: { offset: 9, path: [1, 0] } });
    const selection = editor.selection;

    editor.tf.setValue([paragraph('hello'), paragraph('two')]);
    keepSelection(editor, selection);

    expect(editor.selection).toEqual({
      anchor: { offset: 3, path: [1, 0] },
      focus: { offset: 3, path: [1, 0] },
    });
  });

  it('leaves the selection where its text is gone', () => {
    const editor = createPlateEditor({ value: [paragraph('hello'), paragraph('second')] });
    editor.tf.select({ anchor: { offset: 2, path: [1, 0] }, focus: { offset: 2, path: [1, 0] } });
    const selection = editor.selection;

    editor.tf.setValue([paragraph('only')]);
    const replaced = editor.selection;
    keepSelection(editor, selection);

    expect(editor.selection).toEqual(replaced);
  });
});

describe('takeDocument', () => {
  const HELD = ['# Title', '', '- one', '- two'].join('\n');
  const OUTSIDE = ['# Title', '', '- one', '- two changed'].join('\n');

  const value = (markdown: string) => deserializeMarkdownToPlateValue(markdown).value;

  // A pane's editor — the text it opened on, or the empty value it holds until a text arrives
  const pane = (markdown?: string) =>
    createPlateEditor({
      plugins: [PanePlugin],
      value: markdown === undefined ? [paragraph('')] : value(markdown),
    });

  const texts = (editor: ReturnType<typeof pane>) =>
    editor.children.map((node) => NodeApi.string(node));

  const registered: (() => void)[] = [];

  const register = (id: string, editor: ReturnType<typeof pane>) =>
    registered.push(registerPane(id, editor));

  afterEach(() => registered.splice(0).forEach((off) => off()));

  it('gives a text from outside to every pane', () => {
    const first = pane(HELD);
    const second = pane(HELD);

    register('a', first);
    register('b', second);
    takeDocument(first, () => first.tf.setValue(value(OUTSIDE)));

    expect(texts(first)).toEqual(['Title', 'one', 'two changed']);
    expect(texts(second)).toEqual(texts(first));
  });

  it('does not give it again to a pane that opened on it', () => {
    const first = pane();

    register('a', first);
    takeDocument(first, () => first.tf.setValue(value(HELD)));

    // - A pane opening in the same turn takes the document as it stands; the flush comes after it
    const second = pane();

    register('b', second);
    forwardChange(first);

    expect(texts(second)).toEqual(['Title', 'one', 'two']);
  });
});

// end-fork-add external-reload
