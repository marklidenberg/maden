// fork-add link-exit

import { LinkPlugin } from '@platejs/link/react';
import { createPlateEditor } from 'platejs/react';
import { describe, expect, it } from 'vitest';

import { LinkExitPlugin } from '../../src/webview/lib/link-exit';

const createEditor = () =>
  createPlateEditor({
    plugins: [LinkPlugin, LinkExitPlugin],
    value: [
      {
        children: [
          { text: 'see ' },
          { children: [{ text: 'docs' }], type: 'a', url: 'https://example.com' },
          { text: '' },
        ],
        type: 'p',
      },
    ],
  });

const texts = (editor: ReturnType<typeof createEditor>) =>
  (editor.children[0].children as any[]).map((node) =>
    node.type === 'a' ? { link: node.children[0].text } : node.text
  );

describe('link exit', () => {
  it('types past a link, at its end', () => {
    const editor = createEditor();

    editor.tf.select({ offset: 4, path: [0, 1, 0] });
    editor.tf.insertText('!');
    editor.tf.insertText(' more');

    expect(texts(editor)).toEqual(['see ', { link: 'docs' }, '! more']);
  });

  it('types inside a link, before its end', () => {
    const editor = createEditor();

    editor.tf.select({ offset: 2, path: [0, 1, 0] });
    editor.tf.insertText('x');

    expect(texts(editor)).toEqual(['see ', { link: 'doxcs' }, '']);
  });

  it('keeps the cursor marks', () => {
    const editor = createEditor();

    editor.tf.select({ offset: 4, path: [0, 1, 0] });
    editor.tf.addMark('bold', true);
    editor.tf.insertText('b');

    expect(editor.children[0].children[2]).toEqual({ bold: true, text: 'b' });
  });
});

// end-fork-add link-exit
