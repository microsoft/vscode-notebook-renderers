// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export const JupyterNotebookRenderer = 'jupyter-notebook-renderer';
// Callback function registered by the renderer client code. We use the
// viewType to make this unique so that other renderers don't conflict.
// https://github.com/microsoft/vscode-notebook-renderer-starter/blob/73f17bcd72c5afb9504a5db2db521fd8e3cbadba/src/common/constants.ts
export const renderCallback = `render-notebook-${JupyterNotebookRenderer}`;
