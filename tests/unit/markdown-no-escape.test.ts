import { describe, expect, it } from 'vitest';

import { reconcileMarkdownPreservingUnchangedFormatting } from '../../src/shared/markdown-format-reconcile';
import {
  canonicalizeMarkdown,
  deserializeMarkdownToPlateValue,
  roundTripMarkdownWithPlate,
  serializePlateValueWithConversionEditor,
} from '../../src/webview/lib/markdown-plate-conversion';

const serialize = (markdown: string): string =>
  canonicalizeMarkdown(roundTripMarkdownWithPlate(markdown).serializedMarkdown);

const PLAN = [
  '# Plan',
  '',
  '- wise-plan: next',
  '  - [ ] 🧩 tool: title',
  '    - [x] - step_a',
  '    - [~] - step_b',
  '    - [ ] - | step_c',
  '    - [ ] - step_d: 🧑 owner',
  '    - [ ] - group',
  '      - [ ] + join ← [[inline_a]], [[inline_b]]',
  '    - [ ] ...',
].join('\n');

describe('markdown serialization without escapes', () => {
  it('writes a plan back exactly as typed', () => {
    expect(serialize(PLAN)).toBe(PLAN);
  });

  it('leaves brackets, dashes, underscores and pipes alone', () => {
    const source = 'a_b_c, [~] and [ ], 1. not a list, - not a bullet, a | b, #hash, 100% done.';

    expect(serialize(source)).toBe(source);
  });

  it('drops escapes an earlier save wrote', () => {
    expect(serialize('- \\[~\\] - step\\_b')).toBe('- [~] - step_b');
  });

  it('still escapes what a construct needs', () => {
    const table = ['| a | b |', '| --- | --- |', '| x \\| y | z |'].join('\n');

    expect(serialize(table)).toContain('x \\| y');
    expect(serialize('[a \\[b\\] c](https://example.com)')).toBe(
      '[a \\[b\\] c](https://example.com)'
    );
  });

  it('keeps the rest of a plan byte for byte when a line is added', () => {
    const value = deserializeMarkdownToPlateValue(PLAN).value;
    const edited = [
      ...value,
      { children: [{ text: 'appended note' }], type: 'p' },
    ];
    const saved = reconcileMarkdownPreservingUnchangedFormatting(
      PLAN,
      serializePlateValueWithConversionEditor(edited)
    );

    expect(saved).toContain('appended note');
    expect(
      canonicalizeMarkdown(
        saved
          .split('\n')
          .filter((line) => line !== 'appended note')
          .join('\n')
      )
    ).toBe(PLAN);
  });
});
