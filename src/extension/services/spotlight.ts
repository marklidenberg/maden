// fork-add spotlight

import * as vscode from 'vscode';

import type { HostToWebviewMessage } from '../../shared/messages';

const panels = new Set<vscode.WebviewPanel>();

// A maden panel, while it lives.
export const trackSpotlightPanel = (panel: vscode.WebviewPanel) => {
  panels.add(panel);
  panel.onDidDispose(() => panels.delete(panel));
};

// `maden.spotlight` — the active panel opens its spotlight; `ctrl+p` by default, `package.json`.
export const registerSpotlight = (): vscode.Disposable =>
  vscode.commands.registerCommand('maden.spotlight', () => {
    const message: HostToWebviewMessage = { type: 'openSpotlight' };

    for (const panel of panels) {
      if (panel.active) void panel.webview.postMessage(message);
    }
  });

// end-fork-add spotlight
