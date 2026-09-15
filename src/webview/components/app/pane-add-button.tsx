// fork-add panes

import { PlusIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { splitPane } from '@/lib/panes';

// Under the bar's toggle.
export function PaneAddButton() {
  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      className="pointer-events-auto h-8 w-8 bg-background/95 backdrop-blur-sm"
      aria-label="Split pane"
      title="Split pane"
      onClick={() => splitPane()}
      onMouseDown={(e) => e.preventDefault()}
    >
      <PlusIcon className="h-4 w-4" />
    </Button>
  );
}

// end-fork-add panes
