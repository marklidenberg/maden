// fork-add spotlight

import { NodeApi } from 'platejs';
import { createPlateEditor } from 'platejs/react';
import { describe, expect, it } from 'vitest';

import { deserializeMarkdownToPlateValue } from '../../src/webview/lib/markdown-plate-conversion';
import { getZoom, NodeZoomPlugin } from '../../src/webview/lib/node-zoom';
import {
  bulletsOf,
  fuzzyMatch,
  pushRecent,
  resolveRecent,
  searchBullets,
  SpotlightPlugin,
  spotlightJump,
} from '../../src/webview/lib/spotlight';

const SOURCE = [
  '# Title',
  '',
  'intro',
  '',
  '## Projects',
  '',
  '- Maden',
  '  - Spotlight search',
  '  - Zoom',
  '- Wise',
  '',
  '## Notes',
  '',
  'text',
  '',
  '1. Groceries',
  '2. Spotlight lamp',
].join('\n');

const createEditor = () =>
  createPlateEditor({
    plugins: [NodeZoomPlugin, SpotlightPlugin],
    value: deserializeMarkdownToPlateValue(SOURCE).value,
  });

const indexOf = (editor: ReturnType<typeof createEditor>, text: string) =>
  editor.children.findIndex((node) => NodeApi.string(node) === text);

const recentTexts = (editor: ReturnType<typeof createEditor>) =>
  resolveRecent(bulletsOf(editor.children), editor.getOption(SpotlightPlugin, 'recent')).map(
    (bullet) => bullet.text
  );

describe('spotlight', () => {
  it('lists the bullets, each with its breadcrumb', () => {
    const value = deserializeMarkdownToPlateValue(SOURCE).value;

    expect(bulletsOf(value).map(({ crumbs, text }) => [text, crumbs])).toEqual([
      ['Maden', ['Title', 'Projects']],
      ['Spotlight search', ['Title', 'Projects', 'Maden']],
      ['Zoom', ['Title', 'Projects', 'Maden']],
      ['Wise', ['Title', 'Projects']],
      ['Groceries', ['Title', 'Notes', 'text']],
      ['Spotlight lamp', ['Title', 'Notes', 'text']],
    ]);
  });

  it('matches letters in order, runs and word starts first', () => {
    expect(fuzzyMatch('spt', 'Spotlight search')?.indexes).toEqual([0, 1, 3]);
    expect(fuzzyMatch('sl', 'Spotlight lamp')?.indexes).toEqual([0, 10]);
    expect(fuzzyMatch('lamp spot', 'Spotlight lamp')?.indexes).toEqual([0, 1, 2, 3, 10, 11, 12, 13]);
    expect(fuzzyMatch('пок', 'Список покупок')?.indexes).toEqual([7, 8, 9]);
    expect(fuzzyMatch('zz', 'Maden')).toBeNull();
  });

  it('ranks the bullets', () => {
    const all = bulletsOf(deserializeMarkdownToPlateValue(SOURCE).value);
    const texts = (query: string) => searchBullets(all, query).map(({ bullet }) => bullet.text);

    expect(texts('sl')[0]).toBe('Spotlight lamp');
    expect(texts('spot')).toEqual(['Spotlight lamp', 'Spotlight search']);
    expect(texts('md')).toEqual(['Maden']);
  });

  it('keeps recents, the latest first, by id or by text', () => {
    const all = bulletsOf(deserializeMarkdownToPlateValue(SOURCE).value);
    const zoom = all.find((bullet) => bullet.text === 'Zoom')!;
    const wise = all.find((bullet) => bullet.text === 'Wise')!;

    let recent = pushRecent([], { id: zoom.id, text: 'Zoom' });
    recent = pushRecent(recent, { id: wise.id, text: 'Wise' });
    recent = pushRecent(recent, { id: zoom.id, text: 'Zoom' });

    expect(recent.map(({ text }) => text)).toEqual(['Zoom', 'Wise']);
    expect(
      resolveRecent(all, [
        { text: 'Groceries' },
        { id: zoom.id, text: 'renamed' },
        { id: 'gone', text: 'gone' },
      ]).map(({ text }) => text)
    ).toEqual(['Groceries', 'Zoom']);
  });

  it('makes a bullet typed in recent', () => {
    const editor = createEditor();

    editor.tf.insertText('!', { at: editor.api.end([indexOf(editor, 'Zoom')])! });
    editor.tf.insertText('!', { at: editor.api.end([0])! });
    editor.tf.insertText('!', { at: editor.api.end([indexOf(editor, 'Wise')])! });

    expect(recentTexts(editor)).toEqual(['Wise!', 'Zoom!']);
  });

  it('zooms in on the bullet picked', () => {
    const editor = createEditor();
    const index = indexOf(editor, 'Spotlight search');
    const id = editor.children[index].id as string;

    expect(spotlightJump(editor, id)).toBe(true);
    expect(getZoom(editor.getOption(NodeZoomPlugin, 'stack'))?.root).toBe(id);
    expect(editor.selection?.focus.path[0]).toBe(index);
    expect(recentTexts(editor)).toEqual(['Spotlight search']);
    expect(spotlightJump(editor, 'gone')).toBe(false);
  });
});

// end-fork-add spotlight
