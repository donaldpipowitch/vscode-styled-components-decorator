import * as vscode from 'vscode';
import { onTextUpdates } from './vscode-helper';
import { getComponentsCreatedByStyledComponents } from './typescript-helper';

const decorationType = vscode.window.createTextEditorDecorationType({
  light: {
    before: {
      contentText: 'S.',
      color: 'rgba(255, 0, 255, 0.7)',
    },
  },
  dark: {
    before: {
      contentText: 'S.',
      color: 'rgba(255, 0, 255, 0.7)',
    },
  },
});

export function activate(context: vscode.ExtensionContext) {
  console.log('vscode-styled-components-decorator is now active!');

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'vscode-styled-components-decorator.sayHello',
      (name) => {
        console.log(`Hello vscode-styled-components-decorator!!!`);
        vscode.window.showInformationMessage(
          'vscode-styled-components-decorator is installed.',
        );
      },
    ),
  );

  // whenever relevant text updates happened, we'll get all components created by styled-components
  // and decorate the first character of each component
  onTextUpdates(context, async (activeEditor, document) => {
    const components = await getComponentsCreatedByStyledComponents(document);

    const decorations = components.map((component) => {
      const range = new vscode.Range(
        document.positionAt(component.node.getStart() + 1),
        document.positionAt(component.node.getStart() + 1),
      );
      const decoration: vscode.DecorationOptions = {
        range,
        hoverMessage: 'styled-component',
      };
      return decoration;
    });

    activeEditor.setDecorations(decorationType, decorations);
  });
}
