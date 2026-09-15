// fork-add toolbar-right

'use client';

import { cn } from '@/lib/utils';

import { Toolbar } from './toolbar';

// The bar as a rail down the right edge, its buttons under the three dots, the magnifier and the toggle.
export function FixedToolbar(props: React.ComponentProps<typeof Toolbar>) {
  return (
    <Toolbar
      orientation="vertical"
      {...props}
      className={cn(
        'maden-fixed-toolbar-right scrollbar-hide fixed top-0 right-0 bottom-0 z-[90] w-14 flex-col overflow-y-auto border-l border-l-border bg-background/95 pt-[7.25rem] backdrop-blur-sm supports-backdrop-blur:bg-background/60',
        props.className
      )}
    />
  );
}

// A group of the rail, a line above it.
export function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col items-center gap-0.5 border-t border-t-border py-1">
      {children}
    </div>
  );
}

// Tooltips and menus open to the left of the rail.
export const TOOLTIP_LEFT = { side: 'left' } as const;

// end-fork-add toolbar-right
