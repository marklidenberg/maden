'use client';

import { type Value, TrailingBlockPlugin } from 'platejs';
import { type TPlateEditor, useEditorRef } from 'platejs/react';

import { AIKit } from '@/components/editor/plugins/ai-kit';
import { AlignKit } from '@/components/editor/plugins/align-kit';
import { AutoformatKit } from '@/components/editor/plugins/autoformat-kit';
import { BasicBlocksKit } from '@/components/editor/plugins/basic-blocks-kit';
import { BasicMarksKit } from '@/components/editor/plugins/basic-marks-kit';
import { BlockMenuKit } from '@/components/editor/plugins/block-menu-kit';
import { BlockPlaceholderKit } from '@/components/editor/plugins/block-placeholder-kit';
import { CalloutKit } from '@/components/editor/plugins/callout-kit';
import { CodeBlockKit } from '@/components/editor/plugins/code-block-kit';
import { CodeDrawingKit } from '@/components/editor/plugins/code-drawing-kit';
import { ColumnKit } from '@/components/editor/plugins/column-kit';
import { CommentKit } from '@/components/editor/plugins/comment-kit';
import { CursorOverlayKit } from '@/components/editor/plugins/cursor-overlay-kit';
import { DateKit } from '@/components/editor/plugins/date-kit';
import { DiscussionKit } from '@/components/editor/plugins/discussion-kit';
import { DndKit } from '@/components/editor/plugins/dnd-kit';
import { DocxKit } from '@/components/editor/plugins/docx-kit';
import { EmojiKit } from '@/components/editor/plugins/emoji-kit';
import { ExitBreakKit } from '@/components/editor/plugins/exit-break-kit';
import { ExcalidrawKit } from '@/components/editor/plugins/excalidraw-kit';
import { FixedToolbarKit } from '@/components/editor/plugins/fixed-toolbar-kit';

// fork-delete no-selection-popover

// import { FloatingToolbarKit } from '@/components/editor/plugins/floating-toolbar-kit';

// end-fork-delete no-selection-popover

import { FontKit } from '@/components/editor/plugins/font-kit';
import { LineHeightKit } from '@/components/editor/plugins/line-height-kit';
import { LinkKit } from '@/components/editor/plugins/link-kit';
import { ListKit } from '@/components/editor/plugins/list-kit';
import { MarkdownKit } from '@/components/editor/plugins/markdown-kit';
import { MathKit } from '@/components/editor/plugins/math-kit';
import { MediaKit } from '@/components/editor/plugins/media-kit';
import { MentionKit } from '@/components/editor/plugins/mention-kit';
import { SlashKit } from '@/components/editor/plugins/slash-kit';
import { SuggestionKit } from '@/components/editor/plugins/suggestion-kit';
import { TableKit } from '@/components/editor/plugins/table-kit';
import { TocKit } from '@/components/editor/plugins/toc-kit';
import { ToggleKit } from '@/components/editor/plugins/toggle-kit';

// fork-add fold-chevrons

import { FoldKit } from '@/components/editor/plugins/fold-kit';

// end-fork-add fold-chevrons

// fork-add node-zoom

import { NodeZoomKit } from '@/components/editor/plugins/node-zoom-kit';

// end-fork-add node-zoom

// fork-add select-block

import { SelectBlockPlugin } from '@/lib/select-block';

// end-fork-add select-block

// fork-add find-replace

import { FindReplaceKit } from '@/components/editor/plugins/find-replace-kit';

// end-fork-add find-replace

export const EditorKit = [
  ...AIKit,

  // Elements
  ...BasicBlocksKit,
  ...CodeBlockKit,
  ...CodeDrawingKit,
  ...ExcalidrawKit,
  ...TableKit,
  ...ToggleKit,
  ...TocKit,
  ...MediaKit,
  ...CalloutKit,
  ...ColumnKit,
  ...MathKit,
  ...DateKit,
  ...LinkKit,
  ...MentionKit,

  // Marks
  ...BasicMarksKit,
  ...FontKit,

  // Block Style
  ...ListKit,
  ...AlignKit,
  ...LineHeightKit,

  // Collaboration
  ...DiscussionKit,
  ...CommentKit,
  ...SuggestionKit,

  // Editing
  ...SlashKit,
  ...AutoformatKit,
  ...CursorOverlayKit,
  ...BlockMenuKit,
  ...DndKit,

  // fork-add fold-chevrons

  // After `DndKit` — a later wrapper is the outer one, so a hidden block hides its drag row too.
  ...FoldKit,

  // end-fork-add fold-chevrons

  // fork-add node-zoom

  ...NodeZoomKit,

  // end-fork-add node-zoom

  // fork-add select-block

  // After `NodeZoomKit` — wrapped outside its select all, so a caret in one block stays in it.
  SelectBlockPlugin,

  // end-fork-add select-block

  // fork-add find-replace

  ...FindReplaceKit,

  // end-fork-add find-replace

  ...EmojiKit,
  ...ExitBreakKit,
  TrailingBlockPlugin,

  // Parsers
  ...DocxKit,
  ...MarkdownKit,

  // UI
  ...BlockPlaceholderKit,
  ...FixedToolbarKit,

  // fork-delete no-selection-popover

  // ...FloatingToolbarKit,

  // end-fork-delete no-selection-popover
];

export type MyEditor = TPlateEditor<Value, (typeof EditorKit)[number]>;

export const useEditor = () => useEditorRef<MyEditor>();
