'use client';

import { AIChatPlugin } from '@platejs/ai/react';
import { BlockSelectionPlugin } from '@platejs/selection/react';
import { getPluginTypes, isHotkey, KEYS } from 'platejs';

import { BlockSelection } from '@/components/ui/block-selection';

// fork-add block-select

import { BlockSelectPlugin } from '@/lib/block-select';

// end-fork-add block-select

// fork-add block-indent

import { indentSelected } from '@/lib/block-indent';

// end-fork-add block-indent

export const BlockSelectionKit = [
  // fork-add block-select

  BlockSelectPlugin,

  // end-fork-add block-select

  BlockSelectionPlugin.configure(({ editor }) => ({
    options: {
      enableContextMenu: true,
      isSelectable: (element) =>
        !getPluginTypes(editor, [KEYS.column, KEYS.codeLine, KEYS.td]).includes(
          element.type
        ),
      onKeyDownSelecting: (editor, e) => {
        // fork-add block-indent

        indentSelected(editor, e);

        // end-fork-add block-indent

        const aiEnabled = window.__MADEN_AI_ENABLED__ === true;

        if (aiEnabled && isHotkey('mod+j')(e)) {
          editor.getApi(AIChatPlugin).aiChat.show();
        }
      },
    },
    render: {
      belowRootNodes: (props) => {
        if (!props.attributes.className?.includes('slate-selectable'))
          return null;

        return <BlockSelection {...(props as any)} />;
      },
    },
  })),
];
