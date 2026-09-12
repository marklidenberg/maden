'use client';

import { createPlatePlugin } from 'platejs/react';

import { FixedToolbar } from '@/components/ui/fixed-toolbar';

// fork-delete topbar-trimmed

// import { FixedToolbarButtons } from '@/components/ui/fixed-toolbar-buttons';

// end-fork-delete topbar-trimmed

// fork-add topbar-trimmed

import { FixedToolbarButtons } from '@/components/ui/fixed-toolbar-buttons-trimmed';

// end-fork-add topbar-trimmed

export const FixedToolbarKit = [
  createPlatePlugin({
    key: 'fixed-toolbar',
    render: {
      beforeEditable: () => (
        <FixedToolbar>
          <FixedToolbarButtons />
        </FixedToolbar>
      ),
    },
  }),
];
