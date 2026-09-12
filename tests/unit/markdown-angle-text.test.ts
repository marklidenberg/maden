// fork-add markdown-angle-text

import { describe, expect, it } from 'vitest';

import { normalizeOpenDocumentMarkdown } from '../../src/webview/lib/markdown-open-normalize';
import {
  canonicalizeMarkdown,
  roundTripMarkdownWithPlate,
} from '../../src/webview/lib/markdown-plate-conversion';

const serialize = (markdown: string): string =>
  canonicalizeMarkdown(roundTripMarkdownWithPlate(markdown).serializedMarkdown);

describe('a `<` that opens no tag', () => {
  it('is kept, and the rest, as typed', () => {
    const source = [
      'A branch, <name>/<name>.md — the frontmatter alone',
      '',
      '- a <my-file.md> b <- the root, `"<Full Name>"`',
      '',
      'last',
    ].join('\n');

    expect(serialize(source)).toBe(source);
  });

  it('is the only `<` escaped', () => {
    const source = [
      '<Alert type="info">ok</Alert> <Foo/> <!-- note -->',
      '| a <br> b | c |',
      '`<name>`, `<Full Name>`, <https://example.com>, [a](<./b.md>), \\<name>, a < b',
    ].join('\n');

    expect(normalizeOpenDocumentMarkdown(source)).toBe(source);
    expect(normalizeOpenDocumentMarkdown('see <name> here <- 1')).toBe(
      'see &lt;name&gt; here &lt;- 1'
    );
  });
});

// end-fork-add markdown-angle-text
