// fork-add edit-stability

import type { SlateEditor, Value } from 'platejs';

import { createPlatePlugin } from 'platejs/react';

import { keepBlocks } from '@/lib/keep-blocks';
import { keepSelection } from '@/lib/keep-selection';
import {
  canonicalizeMarkdown,
  deserializeMarkdownToPlateValue,
  type MarkdownParseHostError,
  normalizeLineEndings,
  serializePlateValueToMarkdown,
} from '@/lib/markdown-plate-conversion';
import { hasOwnOperations, holdDocument, holdsDocument, takeDocument } from '@/lib/panes';

// The host's text, as a message brings it
export type HostText = {
  external?: boolean;
  fileName: string;
  filePath: string;
  markdown: string;
  revision?: number;
};

export type DocumentChanged = { markdown: string; revision?: number; type: 'documentChanged' };

// The one document of the panes, against the host's — one per webview, whichever pane hears or types
const sync = {
  heard: undefined as { markdown: string; revision?: number } | undefined, // the text last heard
  held: undefined as string | undefined, // the text the host holds — taken from it, or sent it
  post: (_message: DocumentChanged) => {},
  revision: undefined as number | undefined, // of the text last heard
};

export const connectHost = (post: (message: DocumentChanged) => void) => {
  sync.post = post;
};

// The state of a webview opened afresh — tests
export const resetHostSync = () => {
  sync.heard = undefined;
  sync.held = undefined;
  sync.revision = undefined;
};

const serialize = (editor: SlateEditor, value: Value = editor.children): string | undefined => {
  try {
    return serializePlateValueToMarkdown(editor as never, value);
  } catch {
    return undefined;
  }
};

// A text from the host into the panes. Taken where it is a change from outside, a newer revision, or
// the editor holds nothing yet; an echo of the panes' own write is not — they hold newer text.
export const takeHostText = (
  editor: SlateEditor,
  text: HostText,
  onHostError?: (error: MarkdownParseHostError) => void
) => {
  const incoming = normalizeLineEndings(text.markdown);
  const holds = holdsDocument(editor);
  const heard = sync.heard?.markdown === incoming && sync.heard.revision === text.revision;

  // - Heard by another pane

  if (heard && holds) return;

  // - New: an echo of the panes' own write, to a pane holding the document — not taken

  if (!heard) {
    const behind = sync.heard !== undefined && text.revision !== sync.revision;

    sync.heard = { markdown: incoming, revision: text.revision };
    sync.revision = text.revision;

    if (holds && !behind && !text.external) return;
  }

  // - Heard before this editor opened on nothing — the text held since

  const markdown = heard ? (sync.held ?? incoming) : incoming;

  // - The text there already

  const current = serialize(editor);

  if (current !== undefined && canonicalizeMarkdown(current) === canonicalizeMarkdown(markdown)) {
    sync.held = markdown;
    holdDocument(editor);

    return;
  }

  // - Taken in every pane — the ids and the caret kept where their blocks stand

  const next = deserializeMarkdownToPlateValue(markdown, {
    context: { fileName: text.fileName, filePath: text.filePath },
    onHostError,
  }).value;
  const kept = keepBlocks(editor.children, next, editor.selection);

  takeDocument(editor, () => {
    editor.tf.setValue(next);
    keepSelection(editor, kept);
  });

  sync.held = serialize(editor, next) ?? markdown;
};

// A pane's own change to the host — from any pane, the text built on the revision last heard. Not
// from an editor holding nothing of the file, nor a text that would not serialize.
export const sendEdit = (editor: SlateEditor) => {
  if (sync.held === undefined || !holdsDocument(editor)) return;

  const markdown = serialize(editor);

  if (markdown === undefined || markdown === sync.held) return;

  sync.held = markdown;
  sync.post({ markdown, revision: sync.revision, type: 'documentChanged' });
};

// After the panes' plugin — the change forwarded, then sent.
export const HostSyncPlugin = createPlatePlugin({
  key: 'hostSync',
  handlers: {
    onChange: ({ editor }) => {
      if (hasOwnOperations(editor)) sendEdit(editor);
    },
  },
});

// end-fork-add edit-stability
