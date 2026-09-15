import * as vscode from 'vscode';

import { MadenMarkdownEditorProvider } from './MadenMarkdownEditorProvider';
// fork-add spotlight

import { registerSpotlight } from './services/spotlight';

// end-fork-add spotlight
// fork-add keep-tabs

import { registerKeepTabs } from './services/keep-tabs';

// end-fork-add keep-tabs

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(MadenMarkdownEditorProvider.register(context));
  // fork-add spotlight

  context.subscriptions.push(registerSpotlight());

  // end-fork-add spotlight
  // fork-add keep-tabs

  context.subscriptions.push(registerKeepTabs(MadenMarkdownEditorProvider.viewType));

  // end-fork-add keep-tabs
}

export function deactivate(): void {
  // no-op
}
