import * as vscode from 'vscode';

export function onTextUpdates(
  context: vscode.ExtensionContext,
  callback: (editor: vscode.TextEditor, document: vscode.TextDocument) => void,
) {
  let timeout: NodeJS.Timer | undefined = undefined;
  let activeEditor = vscode.window.activeTextEditor;

  function update() {
    if (!activeEditor) return;
    const { document } = activeEditor;
    if (!document) return;
    callback(activeEditor, document);
  }

  function triggerUpdate(throttle = false) {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }
    if (throttle) {
      timeout = setTimeout(update, 500);
    } else {
      update();
    }
  }
  if (activeEditor) triggerUpdate();

  vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      activeEditor = editor;
      if (editor) triggerUpdate();
    },
    null,
    context.subscriptions,
  );

  vscode.workspace.onDidChangeTextDocument(
    (event) => {
      if (activeEditor && event.document === activeEditor.document)
        triggerUpdate(true);
    },
    null,
    context.subscriptions,
  );
}
