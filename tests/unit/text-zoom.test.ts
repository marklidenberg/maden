// fork-add text-zoom

import { describe, expect, it } from 'vitest';

import { parseTextZoom, zoomTextIn, zoomTextOut } from '../../src/webview/lib/text-zoom';

describe('text zoom', () => {
  it('steps in and out', () => {
    expect(zoomTextIn(1)).toBe(1.1);
    expect(zoomTextOut(1)).toBe(0.9);
    expect(zoomTextIn(0.67)).toBe(0.75);
  });

  it('stops at the ends', () => {
    expect(zoomTextIn(2)).toBe(2);
    expect(zoomTextOut(0.5)).toBe(0.5);
  });

  it('reads a stored step, anything else as 100%', () => {
    expect(parseTextZoom('1.25')).toBe(1.25);
    expect(parseTextZoom(null)).toBe(1);
    expect(parseTextZoom('1.3')).toBe(1);
    expect(parseTextZoom('big')).toBe(1);
  });
});

// end-fork-add text-zoom
