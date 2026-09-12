// fork-add link-open

import * as vscode from 'vscode';

import { resolveLinkTarget } from '../../shared/link-target';

export const openLink = async (url: string, documentPath: string) => {
  // - Read what the url points at

  const target = resolveLinkTarget(url, documentPath);

  if (target.kind === 'none') {
    return;
  }

  if (target.kind === 'external') {
    await vscode.env.openExternal(vscode.Uri.parse(target.url));
    return;
  }

  // - A path has to be there

  const uri = vscode.Uri.file(target.path);

  let stat: vscode.FileStat;

  try {
    stat = await vscode.workspace.fs.stat(uri);
  } catch {
    void vscode.window.showWarningMessage(`Maden: nothing at ${target.path}`);
    return;
  }

  // - Open it

  if (stat.type === vscode.FileType.Directory) {
    await vscode.commands.executeCommand('revealInExplorer', uri);
    return;
  }

  await vscode.commands.executeCommand('vscode.open', uri);
};

// end-fork-add link-open
