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

// fork-mutate edit-stability

// - Old

// export function deactivate(): void {
//   // no-op
// }

// - New

// The webview writes still pending — made, not lost with the window
export function deactivate(): Promise<void> {
  return MadenMarkdownEditorProvider.flushPendingWrites();
}

// end-fork-mutate edit-stability
