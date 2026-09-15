// fork-add keep-tabs

import { describe, expect, it } from 'vitest';

import { MERGE_MS, createMerges, freeFragment } from '../../src/extension/services/tab-merge';

describe('createMerges', () => {
  it('reads a move into the slot, then a close, as a merge', () => {
    const merges = createMerges<string>();

    merges.changed('maden', 0, 0, 0); // made active
    merges.changed('maden', 0, 1, 0); // moved into the reopened tab's slot

    expect(merges.closed(['maden'], 1)).toBe('maden');
  });

  it('reads a close alone as a close — the next tab made active, unmoved', () => {
    const merges = createMerges<string>();

    merges.changed('maden', 0, 0, 0);

    expect(merges.closed(['maden'], 1)).toBeUndefined();
  });

  it('reads a move long before as no merge', () => {
    const merges = createMerges<string>();

    merges.changed('maden', 0, 1, 0);

    expect(merges.closed(['maden'], MERGE_MS + 1)).toBeUndefined();
  });

  it('reads a move of another tab as no merge', () => {
    const merges = createMerges<string>();

    merges.changed('other', 0, 1, 0);

    expect(merges.closed(['maden'], 1)).toBeUndefined();
  });

  it('takes a move once', () => {
    const merges = createMerges<string>();

    merges.changed('maden', 0, 1, 0);

    expect(merges.closed(['maden'], 1)).toBe('maden');
    expect(merges.closed(['maden'], 2)).toBeUndefined();
  });
});

describe('freeFragment', () => {
  it('takes the first fragment not taken', () => {
    expect(freeFragment([''])).toBe('tab-2');
    expect(freeFragment(['', 'tab-2', 'tab-4'])).toBe('tab-3');
  });
});

// end-fork-add keep-tabs
