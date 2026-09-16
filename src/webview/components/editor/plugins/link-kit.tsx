'use client';

import { LinkPlugin } from '@platejs/link/react';

import { LinkElement } from '@/components/ui/link-node';
import { LinkFloatingToolbar } from '@/components/ui/link-toolbar';

// fork-add link-exit

import { LinkExitPlugin } from '@/lib/link-exit';

// end-fork-add link-exit

export const LinkKit = [
  LinkPlugin.configure({
    render: {
      node: LinkElement,
      afterEditable: () => <LinkFloatingToolbar />,
    },
  }),

  // fork-add link-exit

  LinkExitPlugin,

  // end-fork-add link-exit
];
