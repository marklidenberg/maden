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

  it('indents a new child a step of the list under its parent', () => {
    const edited = FILE.replace('    - e', '    - e\n        - new');

    expect(reconcile(FILE, serialize(edited))).toBe(edited);
  });

  it('writes a line moved by tab at its new depth', () => {
    const edited = FILE.replace('    - [ ] b', '        - [ ] b');

    expect(reconcile(FILE, serialize(edited))).toBe(edited);
    expect(reconcile(edited, serialize(FILE))).toBe(FILE);
  });

  it('keeps the list in place as a child is added and moved under', () => {
    const steps = [
      ['- [/] a', '  - [ ] Waiting', '- [/] bank', '  - [/] ip', '  - [ ] tariff'],
      ['- [/] a', '  - [ ] Waiting', '- [/] bank', '- [ ] Waiting', '  - [/] ip', '  - [ ] tariff'],
      ['- [/] a', '  - [ ] Waiting', '- [/] bank', '  - [ ] Waiting', '  - [/] ip', '  - [ ] tariff'],
      ['- [/] a', '  - [ ] Waiting', '- [/] bank', '  - [ ] Waiting', '    - [/] ip', '  - [ ] tariff'],
      ['- [/] a', '  - [ ] Waiting', '- [/] bank', '  - [ ] Waiting', '    - [/] ip x', '  - [ ] tariff'],
    ];

    for (const unit of [2, 4]) {
      const asFile = (lines: string[]): string =>
        lines.map((line) => line.replace(/^ */u, (indent) => ' '.repeat((indent.length / 2) * unit))).join('\n');
      let file = asFile(steps[0]);

      for (const step of steps.slice(1)) {
        file = reconcile(file, serialize(step.join('\n')));

        expect(file).toBe(asFile(step));
      }
    }
  });

  it('keeps the paragraph of an item maden lifts out of its list', () => {
    const file = ['- a', '', '  para', '', '  - b', '- c'].join('\n');

    expect(reconcile(file, serialize(file.replace('- c', '- c2')))).toBe(file.replace('- c', '- c2'));
  });

  it('keeps a code line re-indented inside a fence', () => {
    const file = ['```', 'a', '    b', '```'].join('\n');
    const edited = file.replace('    b', '        b');

    expect(reconcile(file, edited)).toBe(edited);
  });
});

// end-fork-add keep-indent
