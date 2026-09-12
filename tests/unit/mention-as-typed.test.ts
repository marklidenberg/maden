// fork-add mention-as-typed

import { describe, expect, it } from 'vitest';

import {
  canonicalizeMarkdown,
  roundTripMarkdownWithPlate,
} from '../../src/webview/lib/markdown-plate-conversion';

const serialize = (markdown: string): string =>
  canonicalizeMarkdown(roundTripMarkdownWithPlate(markdown).serializedMarkdown);

describe('mentions as typed', () => {
  it('writes `@name` back as typed', () => {
    const source = '- [ ] - @root_task, ask @owner.';

    expect(serialize(source)).toBe(source);
  });

  it('writes a mention link back as typed', () => {
    const source = 'ask [Owner](mention:owner)';

    expect(serialize(source)).toBe(source);
  });
});

// end-fork-add mention-as-typed
