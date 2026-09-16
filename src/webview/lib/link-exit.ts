// fork-add link-exit

import type { SlateEditor } from 'platejs';

import { KEYS, PathApi } from 'platejs';
import { createPlatePlugin } from 'platejs/react';

// The caret at a link's end moves past it — the text typed there lands outside. The cursor's marks
// kept.
export const exitLinkEnd = (editor: SlateEditor) => {
  const { selection } = editor;

  if (!selection || !editor.api.isCollapsed()) return;

  const link = editor.api.above({ match: { type: editor.getType(KEYS.link) } });

  if (!link || !editor.api.isEnd(selection.focus, link[1])) return;

  const { marks } = editor;

  // Slate keeps a text node after an inline — the caret goes to its start.

  editor.tf.select(editor.api.start(PathApi.next(link[1]))!);
  editor.marks = marks;
};

export const LinkExitPlugin = createPlatePlugin({ key: 'linkExit' }).overrideEditor(
  ({ editor, tf: { insertText } }) => ({
    transforms: {
      insertText(text, options) {
        if (!options?.at) exitLinkEnd(editor);

        insertText(text, options);
      },
    },
  })
);

// end-fork-add link-exit
