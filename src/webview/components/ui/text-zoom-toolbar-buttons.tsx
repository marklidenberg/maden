// fork-add text-zoom

'use client';

import * as React from 'react';

import { AArrowDownIcon, AArrowUpIcon } from 'lucide-react';

import {
  TEXT_ZOOM_STORAGE_KEY,
  parseTextZoom,
  zoomTextIn,
  zoomTextOut,
} from '@/lib/text-zoom';

import { ToolbarButton } from './toolbar';

export function TextZoomToolbarButtons() {
  const [zoom, setZoom] = React.useState(() =>
    parseTextZoom(window.localStorage.getItem(TEXT_ZOOM_STORAGE_KEY))
  );

  React.useEffect(() => {
    document.documentElement.style.setProperty('--maden-text-zoom', String(zoom));
    window.localStorage.setItem(TEXT_ZOOM_STORAGE_KEY, String(zoom));
  }, [zoom]);

  return (
    <>
      <ToolbarButton
        disabled={zoomTextOut(zoom) === zoom}
        onClick={() => setZoom(zoomTextOut)}
        onMouseDown={(e) => e.preventDefault()}
        tooltip="Smaller text"
      >
        <AArrowDownIcon />
      </ToolbarButton>

      <ToolbarButton
        className="min-w-12 tabular-nums"
        onClick={() => setZoom(1)}
        onMouseDown={(e) => e.preventDefault()}
        tooltip="Reset text size"
      >
        {Math.round(zoom * 100)}%
      </ToolbarButton>

      <ToolbarButton
        disabled={zoomTextIn(zoom) === zoom}
        onClick={() => setZoom(zoomTextIn)}
        onMouseDown={(e) => e.preventDefault()}
        tooltip="Larger text"
      >
        <AArrowUpIcon />
      </ToolbarButton>
    </>
  );
}

// end-fork-add text-zoom
