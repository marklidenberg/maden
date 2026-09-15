// fork-add topbar-toggle

import { PanelTopCloseIcon, PanelTopOpenIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function TopbarToggle({
  onToggle,
  visible,
}: {
  onToggle: (next: boolean) => void;
  visible: boolean;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      className="pointer-events-auto ml-1 h-8 w-8 bg-background/95 backdrop-blur-sm"
      aria-label={visible ? 'Hide toolbar' : 'Show toolbar'}
      aria-pressed={visible}
      onClick={() => onToggle(!visible)}
      onMouseDown={(e) => e.preventDefault()}
    >
      {visible ? <PanelTopCloseIcon className="h-4 w-4" /> : <PanelTopOpenIcon className="h-4 w-4" />}
    </Button>
  );
}

// end-fork-add topbar-toggle
