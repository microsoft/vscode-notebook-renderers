// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// This must be on top, do not change. Required by webpack.
// eslint-disable-next-line no-unused-vars
declare let __webpack_public_path__: string;
declare const scriptUrl: string;
const getPublicPath = () => {
    return new URL(scriptUrl.replace(/[^/]+$/, '')).toString();
};

// eslint-disable-next-line prefer-const
__webpack_public_path__ = getPublicPath();
// This must be on top, do not change. Required by webpack.

import { nbformat } from '@jupyterlab/coreutils';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { CellOutput } from './render';
import { ActivationFunction, CellInfo } from 'vscode-notebook-renderer';

export const activate: ActivationFunction = () => {
    console.log('Jupyter Notebook Renderer activated');
    return {
        renderCell(_id, cellInfo: CellInfo) {
            renderOutput(cellInfo);
        }
    };
};

/**
 * Called from renderer to render output.
 * This will be exposed as a public method on window for renderer to render output.
 */
function renderOutput(cellInfo: CellInfo) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mimeString = cellInfo.mime || (cellInfo as any).mimeType;
    try {
        console.log('request', cellInfo);
        const output = convertVSCodeOutputToExecutResultOrDisplayData(cellInfo);
        console.log(`Rendering mimeType ${mimeString}`, output);

        ReactDOM.render(React.createElement(CellOutput, { mimeType: mimeString, output }, null), cellInfo.element);
    } catch (ex) {
        console.error(`Failed to render mime type ${mimeString}`, ex);
    }
}

function convertVSCodeOutputToExecutResultOrDisplayData(
    cellInfo: CellInfo
): nbformat.IExecuteResult | nbformat.IDisplayData {
    return {
        data: {
            [cellInfo.mime]: cellInfo.mime.toLowerCase().includes('json') ? cellInfo.json() : cellInfo.text()
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: (cellInfo.metadata as any) || {},
        execution_count: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        output_type: (cellInfo.metadata as any)?.outputType || 'execute_result'
    };
}
