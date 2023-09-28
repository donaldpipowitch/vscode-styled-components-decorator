import * as vscode from 'vscode';
import * as ts from 'typescript';
import { join, resolve } from 'path';

type ReactComponent = {
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement;
  symbol: ts.Symbol;
  importSpecifier?: ts.ImportSpecifier;
};

export async function getComponentsCreatedByStyledComponents(
  document: vscode.TextDocument,
) {
  const reactComponents: ReactComponent[] = [];

  const filePaths = await vscode.workspace
    .findFiles('**/*.{tsx,ts}', '**/node_modules/**')
    .then((files) => files.map((file) => file.fsPath));

  const config = getTsConfig();

  const compilerHost = createCompilerHost(config?.options);
  const program = ts.createProgram({
    rootNames: config?.fileNames ?? filePaths,
    options: config?.options ?? {},
    host: compilerHost,
    projectReferences: config?.projectReferences,
  });

  const sourceFile = program.getSourceFile(document.uri.fsPath);
  if (!sourceFile) return reactComponents;

  // find all react components in the source file
  function visit(node: ts.Node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const symbol = program.getTypeChecker().getSymbolAtLocation(node.tagName);
      if (symbol) {
        const importSpecifier = symbol.declarations?.find((declaration) =>
          ts.isImportSpecifier(declaration),
        ) as ts.ImportSpecifier | undefined;
        reactComponents.push({
          node,
          symbol,
          importSpecifier,
        });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);

  // filter components that are created by styled-components
  return reactComponents.filter((component) => {
    // find the implementation of my component considering the import specifier
    const implementationSourceFile = component.importSpecifier
      ? getImplementationSourceFile(program, component.importSpecifier)
      : component.node.getSourceFile();
    if (!implementationSourceFile) return false;

    const implementationVariableDeclaration = findImplementation(
      implementationSourceFile,
      component.symbol.name,
      Boolean(component.importSpecifier),
    );
    if (!implementationVariableDeclaration) return false;

    if (
      implementationVariableDeclaration.initializer &&
      ts.isTaggedTemplateExpression(
        implementationVariableDeclaration.initializer,
      ) &&
      ts.isPropertyAccessExpression(
        implementationVariableDeclaration.initializer.tag,
      ) &&
      ts.isIdentifier(
        implementationVariableDeclaration.initializer.tag.expression,
      ) &&
      implementationVariableDeclaration.initializer.tag.expression.text ===
        'styled'
    )
      return true;

    return false;
  });
}

function getTsConfig() {
  const rootPath = vscode.workspace.workspaceFolders
    ? vscode.workspace.workspaceFolders[0].uri.fsPath || ''
    : '';

  const tsconfigPath = ts.findConfigFile(
    rootPath,
    ts.sys.fileExists,
    'tsconfig.json',
  );
  if (!tsconfigPath) return;

  const { config } = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  const parsedConfig = ts.parseJsonConfigFileContent(config, ts.sys, rootPath);
  return parsedConfig;
}

// this custom compiler host will return unsaved changes from the editor
function createCompilerHost(options: ts.CompilerOptions | undefined) {
  const compilerHost = ts.createCompilerHost(options ?? {});
  const originalGetSourceFile = compilerHost.getSourceFile;

  compilerHost.getSourceFile = (
    fileName: string,
    languageVersion: ts.ScriptTarget,
    onError?: (message: string) => void,
    shouldCreateNewSourceFile?: boolean,
  ) => {
    const document = vscode.workspace.textDocuments.find(
      (document) => document.uri.fsPath === fileName,
    );
    if (document) {
      const sourceText = document.getText();
      return ts.createSourceFile(fileName, sourceText, languageVersion);
    }

    return originalGetSourceFile(
      fileName,
      languageVersion,
      onError,
      shouldCreateNewSourceFile,
    );
  };

  return compilerHost;
}

function getImplementationSourceFile(
  program: ts.Program,
  importSpecifier: ts.ImportSpecifier,
): ts.SourceFile | undefined {
  const importDeclaration = importSpecifier?.parent?.parent?.parent;
  if (!importDeclaration) return;

  if (!ts.isStringLiteral(importDeclaration.moduleSpecifier)) return;

  const sourceFilePath = resolveModuleSpecifierToFilePath(
    program,
    importDeclaration.moduleSpecifier.text,
    importDeclaration.getSourceFile().fileName,
  );
  if (!sourceFilePath) return;

  return program.getSourceFile(sourceFilePath);
}

function resolveModuleSpecifierToFilePath(
  program: ts.Program,
  moduleSpecifierText: string,
  containingFilePath: string,
): string | undefined {
  const compilerOptions = program.getCompilerOptions();

  const importPath =
    !moduleSpecifierText.startsWith('.') && compilerOptions.baseUrl
      ? join(compilerOptions.baseUrl, moduleSpecifierText)
      : moduleSpecifierText;
  const resolvedModule = ts.resolveModuleName(
    importPath,
    containingFilePath,
    compilerOptions,
    ts.sys,
  );
  if (resolvedModule.resolvedModule) {
    const resolvedFileName = resolvedModule.resolvedModule.resolvedFileName;
    if (resolvedFileName.endsWith('.d.ts')) {
      // Don't try to read .d.ts files
      return undefined;
    }
    return resolvedFileName;
  }
  return undefined;
}

function findImplementation(
  sourceFile: ts.SourceFile,
  componentName: string,
  exportOnly: boolean,
): ts.VariableDeclaration | void {
  for (const statement of sourceFile.statements) {
    if (
      ts.isVariableStatement(statement) &&
      (exportOnly ? hasExportModifier(statement) : true)
    ) {
      const declarations = statement.declarationList.declarations;
      for (const declaration of declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          declaration.name.text === componentName
        ) {
          return declaration;
        }
      }
    }
  }
}

function hasExportModifier(node: ts.VariableStatement): boolean {
  return (
    node.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    ) ?? false
  );
}
