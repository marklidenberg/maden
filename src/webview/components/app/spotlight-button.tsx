// fork-add spotlight

import { SearchIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { openSpotlight } from '@/lib/spotlight';

// Between the three dots and the top bar's toggle.
export function SpotlightButton() {
  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      className="pointer-events-auto ml-1 h-8 w-8 bg-background/95 backdrop-blur-sm"
      aria-label="Search bullets"
      title="Search bullets"
      onClick={openSpotlight}
      onMouseDown={(e) => e.preventDefault()}
    >
      <SearchIcon className="h-4 w-4" />
    </Button>
  );
}

// end-fork-add spotlight
