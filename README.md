# vscode-styled-components-decorator

This is more a learning exercise then a real polished VS Code extension, but feel free to use it.

## Features

This extension will add a small pink `S.` in front of components that were ceated by styled-components.

<p align="center">
    <img src="./screenshot.jpg" alt="a screenshot of the extension showing the decorator" width="300" />
</p>

## Installation

Install through VS Code extensions. Search for `vscode-styled-components-decorator`

[Visual Studio Code Market Place: vscode-styled-components-decorator](https://marketplace.visualstudio.com/items?itemName=donaldpipowitch.vscode-styled-components-decorator)

Can also be installed in VS Code: Launch VS Code Quick Open (Ctrl+P), paste the following command, and press enter.

```
ext install donaldpipowitch.vscode-styled-components-decorator
```

## Contribute

- Clone the project and run `$ npm install` inside.
- Preview any changes by pressing `F5` within VS Code. This will compile the extension and launch it in an example project.
- Run `$ npm lint` if you made changes that you'd like to include.

## Publishing

- Follow [this guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) for the general setup.
- Update `CHANGELOG.md`.
- Run `$ vsce publish {your.version.number}`.
