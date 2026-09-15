// fork-add topbar-trimmed

'use client';

import { KEYS } from 'platejs';
import { useEditorReadOnly } from 'platejs/react';

import { RedoToolbarButton, UndoToolbarButton } from './history-toolbar-button';
import { MediaToolbarButton } from './media-toolbar-button';

// fork-delete hide-mark-menu

// import { MoreToolbarButton } from './more-toolbar-button';

// end-fork-delete hide-mark-menu

import { TableToolbarButton } from './table-toolbar-button';
import { ToolbarGroup } from './toolbar';
import { TurnIntoToolbarButton } from './turn-into-toolbar-button';
// fork-add text-zoom

import { TextZoomToolbarButtons } from './text-zoom-toolbar-buttons';

// end-fork-add text-zoom

export function FixedToolbarButtons() {
  const readOnly = useEditorReadOnly();

  return (
    // A row along the bar, the text zoom at its end
    <div className="maden-fixed-toolbar-buttons flex items-center">
      {!readOnly && (
        <>
          <ToolbarGroup>
            <UndoToolbarButton />
            <RedoToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <TurnIntoToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <TableToolbarButton />
            <MediaToolbarButton nodeType={KEYS.img} />
            <MediaToolbarButton nodeType={KEYS.file} />
          </ToolbarGroup>

          {/* fork-delete hide-mark-menu */}

          {/* <ToolbarGroup>
            <MoreToolbarButton />
          </ToolbarGroup> */}

          {/* end-fork-delete hide-mark-menu */}
        </>
      )}

      {/* fork-add text-zoom */}

      <ToolbarGroup>
        <TextZoomToolbarButtons />
      </ToolbarGroup>

      {/* end-fork-add text-zoom */}
    </div>
  );
}

// end-fork-add topbar-trimmed
