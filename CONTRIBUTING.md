# Contributing to the Notebook Renderers extension for Visual Studio Code


## Contributing a pull request

### Prerequisites

1. [Node.js](https://nodejs.org/) 18.15.0
1. npm 9.5.0
1. Windows, macOS, or Linux
1. [Visual Studio Code](https://code.visualstudio.com/)
1. The following VS Code extensions:
    - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
    - [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
    - [EditorConfig for VS Code](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)

### Setup

```shell
git clone https://github.com/Microsoft/vscode-notebook-renderers
cd vscode-notebook-renderers
npm ci
```

If you see warnings that `The engine "vscode" appears to be invalid.`, you can ignore these.

### Incremental Build

Run the `Build` build Tasks from the [Run Build Task...](https://code.visualstudio.com/docs/editor/tasks) command picker (short cut `CTRL+SHIFT+B` or `⇧⌘B`). This will leave build task running in the background and which will re-run as files are edited and saved. You can see the output from either task in the Terminal panel (use the selector to choose which output to look at).

For incremental builds you can use the following commands depending on your needs:

```shell
npm run dev
```

### Errors and Warnings

TypeScript errors and warnings will be displayed in the `Problems` window of Visual Studio Code.

## Local Build

Steps to build the extension on your machine once you've cloned the repo:

```bash
> npm install -g @vscode/vsce
> npm ci
> npm run package
```


## Local Debugging

1. From the debug panel select `Run Extension`
    Note: This will automatically start the incremental build task.
    Optionally, use the command `Debug: Select and Start Debugging -> Run Extension`
2. Once VS Code launches, open a notebook file (`.ipynb`) with output for one of the mime types supported by this extension (such as `application/vnd.vega.v2+json`)
