// fork-add panes

import * as React from 'react';

import { PinIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getFocusedPinned, subscribeFocusedPinned, togglePin } from '@/lib/panes';
import { cn } from '@/lib/utils';

// Under the plus — the focused pane's pin.
export function PanePinButton() {
  const pinned = React.useSyncExternalStore(subscribeFocusedPinned, getFocusedPinned);

  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      className="pointer-events-auto h-8 w-8 bg-background/95 backdrop-blur-sm"
      aria-label={pinned ? 'Unpin pane' : 'Pin pane'}
      aria-pressed={pinned}
      title={pinned ? 'Unpin pane' : 'Pin pane'}
      onClick={togglePin}
      onMouseDown={(e) => e.preventDefault()}
    >
      <PinIcon className={cn('h-4 w-4', pinned && 'fill-current')} />
    </Button>
  );
}

// end-fork-add panes
