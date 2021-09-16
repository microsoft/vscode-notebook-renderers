// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export const JupyterNotebookRenderer = 'jupyter-notebook-renderer';
export type OpenImageInPlotViewer = {
    type: 'openImageInPlotViewer';
    outputId: string;
    mimeType: string;
};
export type IsJupyterExtensionInstalled = {
    type: 'isJupyterExtensionInstalled';
    response?: boolean;
};
export type SaveImageAs = {
    type: 'saveImageAs';
    outputId: string;
    mimeType: string;
};
