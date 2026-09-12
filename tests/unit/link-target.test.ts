import { describe, expect, it } from 'vitest';

import { resolveLinkTarget } from '../../src/shared/link-target';

describe('resolveLinkTarget', () => {
  const doc = '/workspace/project/docs/note.md';

  it('takes an allowed scheme as external', () => {
    expect(resolveLinkTarget('https://example.com/a?b=1#c', doc)).toEqual({
      kind: 'external',
      url: 'https://example.com/a?b=1#c',
    });
    expect(resolveLinkTarget('mailto:a@b.co', doc)).toEqual({
      kind: 'external',
      url: 'mailto:a@b.co',
    });
    expect(resolveLinkTarget('tel:+123', doc)).toEqual({ kind: 'external', url: 'tel:+123' });
  });

  it('refuses any other scheme, an anchor and an empty url', () => {
    expect(resolveLinkTarget('javascript:alert(1)', doc)).toEqual({ kind: 'none' });
    expect(resolveLinkTarget('data:text/html,<b>', doc)).toEqual({ kind: 'none' });
    expect(resolveLinkTarget('#section', doc)).toEqual({ kind: 'none' });
    expect(resolveLinkTarget('   ', doc)).toEqual({ kind: 'none' });
  });

  it('resolves a relative path from the document', () => {
    expect(resolveLinkTarget('./notes.md', doc)).toEqual({
      kind: 'file',
      path: '/workspace/project/docs/notes.md',
    });
    expect(resolveLinkTarget('notes.md', doc)).toEqual({
      kind: 'file',
      path: '/workspace/project/docs/notes.md',
    });
    expect(resolveLinkTarget('../assets/image.png', doc)).toEqual({
      kind: 'file',
      path: '/workspace/project/assets/image.png',
    });
  });

  it('keeps an absolute path as it stands', () => {
    expect(resolveLinkTarget('/other/place.md', doc)).toEqual({
      kind: 'file',
      path: '/other/place.md',
    });
  });

  it('drops the fragment and decodes the path', () => {
    expect(resolveLinkTarget('my%20notes.md#top', doc)).toEqual({
      kind: 'file',
      path: '/workspace/project/docs/my notes.md',
    });
  });

  it('unwraps a file uri', () => {
    expect(resolveLinkTarget('file:///tmp/a.md', doc)).toEqual({ kind: 'file', path: '/tmp/a.md' });
    expect(resolveLinkTarget('file:///C:/tmp/a.md', doc)).toEqual({
      kind: 'file',
      path: 'C:/tmp/a.md',
    });
  });

  it('reads a windows path as a path, not a scheme', () => {
    expect(resolveLinkTarget('C:\\tmp\\a.md', doc)).toEqual({ kind: 'file', path: 'C:/tmp/a.md' });
    expect(resolveLinkTarget('..\\a.md', 'C:\\workspace\\docs\\note.md')).toEqual({
      kind: 'file',
      path: 'C:/workspace/a.md',
    });
  });
});
