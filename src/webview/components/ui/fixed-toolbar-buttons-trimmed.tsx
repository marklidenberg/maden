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
    // fork-delete topbar-toggle

    // <div className="maden-fixed-toolbar-buttons scrollbar-hide flex w-[calc(100%-2.75rem)] overflow-x-auto pr-2">

    // end-fork-delete topbar-toggle
    // fork-add topbar-toggle
    // fork-delete spotlight

    // <div className="maden-fixed-toolbar-buttons scrollbar-hide flex w-[calc(100%-5rem)] overflow-x-auto pr-2">

    // end-fork-delete spotlight
    // fork-add spotlight

    // Clear of the magnifier too
    <div className="maden-fixed-toolbar-buttons scrollbar-hide flex w-[calc(100%-7.25rem)] overflow-x-auto pr-2">
      {/* end-fork-add spotlight */}
      {/* end-fork-add topbar-toggle */}

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

      <div className="grow" />

      <ToolbarGroup>
        <TextZoomToolbarButtons />
      </ToolbarGroup>

      {/* end-fork-add text-zoom */}
    </div>
  );
}

// end-fork-add topbar-trimmed
