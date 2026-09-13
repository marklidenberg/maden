// fork-add external-reload

import { describe, expect, it } from 'vitest';

import { createPlateEditor } from 'platejs/react';

import { markExternal, readExternalText } from '../../src/extension/services/external-reload';
import { keepSelection } from '../../src/webview/lib/keep-selection';

const paragraph = (text: string) => ({ children: [{ text }], type: 'p' });

describe('readExternalText', () => {
  it('takes a text other than the one held', async () => {
    const text = await readExternalText({
      held: () => 'mine',
      read: async () => 'theirs',
      writes: () => 0,
      writing: () => false,
    });

    expect(text).toBe('theirs');
  });

  it('skips the text held — an echo', async () => {
    const text = await readExternalText({
      held: () => 'mine',
      read: async () => 'mine',
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
      writes: () => 0,
      writing: () => writing,
    });

    expect(text).toBeUndefined();
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

// end-fork-add external-reload
