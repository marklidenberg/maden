// fork-add keep-indent

import { describe, expect, it } from 'vitest';

import { reconcileMarkdownPreservingUnchangedFormatting as reconcile } from '../../src/shared/markdown-format-reconcile';
import {
  canonicalizeMarkdown,
  roundTripMarkdownWithPlate,
} from '../../src/webview/lib/markdown-plate-conversion';

const serialize = (markdown: string): string =>
  canonicalizeMarkdown(roundTripMarkdownWithPlate(markdown).serializedMarkdown);

const FILE = [
  '- parent',
  '    - [ ] a',
  '    - [ ] b',
  '    - c',
  '        - d',
  '    - e',
].join('\n');

describe('keep indent', () => {
  it('writes a line edited and reverted back as it was', () => {
    const edited = FILE.replace('[ ] b', '[x] b').replace('- d', '- d2');
    const saved = reconcile(FILE, serialize(edited));

    expect(saved).toBe(edited);
    expect(reconcile(saved, serialize(FILE))).toBe(FILE);
  });

  it('indents a new line as its siblings', () => {
    const edited = FILE.replace('    - [ ] b', '    - [ ] new\n    - [ ] b');

    expect(reconcile(FILE, serialize(edited))).toBe(edited);
  });

  it('indents a new child a step under its parent', () => {
    const edited = FILE.replace('    - e', '    - e\n        - new');

    expect(reconcile(FILE, serialize(edited))).toBe(
      FILE.replace('    - e', '    - e\n      - new')
    );
  });

  it('keeps a code line re-indented inside a fence', () => {
    const file = ['```', 'a', '    b', '```'].join('\n');
    const edited = file.replace('    b', '        b');

    expect(reconcile(file, edited)).toBe(edited);
  });
});

// end-fork-add keep-indent
