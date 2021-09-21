// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as path from 'path';
export const EXTENSION_ROOT_DIR = path.join(__dirname, '..', '..');
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
