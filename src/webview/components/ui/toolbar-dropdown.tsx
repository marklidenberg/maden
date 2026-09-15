'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ToolbarDropdownRender = (ctx: {
  close: () => void;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => React.ReactNode;

type ToolbarDropdownProps = Omit<DropdownMenuProps, 'open' | 'onOpenChange'> & {
  align?: React.ComponentProps<typeof DropdownMenuContent>['align'];
  alignOffset?: React.ComponentProps<typeof DropdownMenuContent>['alignOffset'];
  contentClassName?: string;
  renderContent: ToolbarDropdownRender;
  // fork-add toolbar-right

  side?: React.ComponentProps<typeof DropdownMenuContent>['side'];

  // end-fork-add toolbar-right
  trigger: (open: boolean) => React.ReactNode;
};

export function ToolbarDropdown({
  align = 'start',
  alignOffset,
  contentClassName,
  renderContent,
  // fork-add toolbar-right

  side,

  // end-fork-add toolbar-right
  trigger,
  ...props
}: ToolbarDropdownProps) {
  const [open, setOpen] = React.useState(false);

  const close = React.useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>{trigger(open)}</DropdownMenuTrigger>

      {/* fork-mutate toolbar-right */}

      {/* - Old */}

      {/* <DropdownMenuContent align={align} alignOffset={alignOffset} className={contentClassName}> */}

      {/* - New */}

      <DropdownMenuContent side={side} align={align} alignOffset={alignOffset} className={contentClassName}>
        {/* end-fork-mutate toolbar-right */}
        {renderContent({ close, open, setOpen })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
