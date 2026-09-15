'use client';

import { createPlatePlugin } from 'platejs/react';

// fork-mutate toolbar-top

// - Old

// import { FixedToolbar } from '@/components/ui/fixed-toolbar';

// - New

import { FixedToolbar } from '@/components/ui/fixed-toolbar-top';

// end-fork-mutate toolbar-top

// fork-mutate topbar-trimmed

// - Old

// import { FixedToolbarButtons } from '@/components/ui/fixed-toolbar-buttons';

// - New

import { FixedToolbarButtons } from '@/components/ui/fixed-toolbar-buttons-trimmed';

// end-fork-mutate topbar-trimmed

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
