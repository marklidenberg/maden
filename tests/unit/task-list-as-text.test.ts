// fork-add task-list-as-text

import { describe, expect, it } from 'vitest';

import {
  canonicalizeMarkdown,
  deserializeMarkdownToPlateValue,
  roundTripMarkdownWithPlate,
} from '../../src/webview/lib/markdown-plate-conversion';

const serialize = (markdown: string): string =>
  canonicalizeMarkdown(roundTripMarkdownWithPlate(markdown).serializedMarkdown);

describe('task lists as text', () => {
  it('opens `- [ ]` as a bullet with `[ ]` inside', () => {
    const [item] = deserializeMarkdownToPlateValue('- [ ] a').value;

    expect(item).toMatchObject({ children: [{ text: '[ ] a' }], listStyleType: 'disc' });
    expect(item).not.toHaveProperty('checked');
  });

  it('writes checks back as typed', () => {
    const source = ['- [ ] a', '- [x] b', '  - [X] c'].join('\n');

    expect(serialize(source)).toBe(source);
  });

  it('keeps an ordered item ordered', () => {
    expect(serialize('1. [ ] d')).toBe('1. [ ] d');
  });
});

// end-fork-add task-list-as-text
