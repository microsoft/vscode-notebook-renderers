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
export declare const ClipboardItem: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prototype: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-unused-vars
    new (options: any): any;
};
export const noop = () => {
    // noop
};

export function isDarkTheme() {
    try {
        return (document.body.dataset.vscodeThemeKind || '').toLowerCase().includes('dark');
    } catch {
        return false;
    }
}
