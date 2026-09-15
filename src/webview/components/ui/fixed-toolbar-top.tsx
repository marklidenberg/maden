// fork-add toolbar-top

'use client';

import * as React from 'react';

import { usePluginOption } from 'platejs/react';
import { createPortal } from 'react-dom';

import { PanePlugin } from '@/lib/panes';
import { useToolbarSlot } from '@/lib/toolbar-top';
import { cn } from '@/lib/utils';

import { Toolbar } from './toolbar';

// The bar's buttons in the row at the top of the page — the focused pane's, sent there from its editor.
export function FixedToolbar(props: React.ComponentProps<typeof Toolbar>) {
  const focused = usePluginOption(PanePlugin, 'focused');
  const slot = useToolbarSlot();

  if (!focused || !slot) return null;

  return createPortal(
    <Toolbar {...props} className={cn('maden-fixed-toolbar-top', props.className)} />,
    slot
  );
}

// end-fork-add toolbar-top
