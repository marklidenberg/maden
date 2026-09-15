import * as vscode from 'vscode';

import { MadenMarkdownEditorProvider } from './MadenMarkdownEditorProvider';
// fork-add spotlight

import { registerSpotlight } from './services/spotlight';

// end-fork-add spotlight

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(MadenMarkdownEditorProvider.register(context));
  // fork-add spotlight

  context.subscriptions.push(registerSpotlight());

  // end-fork-add spotlight
}

export function deactivate(): void {
  // no-op
}
