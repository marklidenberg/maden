// fork-add external-reload

import { type SlateEditor, type TRange, TextApi } from 'platejs';

// The selection put back once the value is replaced — where its text still stands
export const keepSelection = (editor: SlateEditor, selection: TRange | null) => {
  if (!selection) {
    return;
  }

  // - Each point onto its text, the offset clamped

  const hold = (point: TRange['anchor']) => {
    const entry = editor.api.node(point.path);

    if (!entry || !TextApi.isText(entry[0])) {
      return undefined;
    }

    return { path: point.path, offset: Math.min(point.offset, entry[0].text.length) };
  };

  const anchor = hold(selection.anchor);
  const focus = hold(selection.focus);

  if (!anchor || !focus) {
    return;
  }

  // - Put back

  editor.tf.select({ anchor, focus });
};

// end-fork-add external-reload
