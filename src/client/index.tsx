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
import { NotebookOutputEventParams } from 'vscode-notebook-renderer';
import { JupyterNotebookRenderer } from './constants';
import { CellOutput } from './render';

const notebookApi = acquireNotebookRendererApi(JupyterNotebookRenderer);

notebookApi.onDidCreateOutput(renderOutput);

// Copy of vscode-notebook-renderer old types as of 1.48
// Keep these so we can support both the old interface and the new interface
// Interface change here: https://github.com/DefinitelyTyped/DefinitelyTyped/pull/51675/files
interface OldNotebookCellOutputMetadata {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    custom?: { [key: string]: any };
}
interface OldNotebookOutput {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { [mimeType: string]: any };
    metadata?: OldNotebookCellOutputMetadata;
}
interface OldNotebookOutputEventParams {
    element: HTMLElement;
    outputId: string;
    output: OldNotebookOutput;
    mimeType: string;
}

/**
 * Called from renderer to render output.
 * This will be exposed as a public method on window for renderer to render output.
 */
function renderOutput(request: NotebookOutputEventParams) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mimeString = request.mime || (request as any).mimeType;
    try {
        console.log('request', request);
        const output = convertVSCodeOutputToExecutResultOrDisplayData(request);
        console.log(`Rendering mimeType ${mimeString}`, output);
        console.log('request output', output);

        ReactDOM.render(React.createElement(CellOutput, { mimeType: mimeString, output }, null), request.element);
    } catch (ex) {
        console.error(`Failed to render mime type ${mimeString}`, ex);
    }
}

function convertVSCodeOutputToExecutResultOrDisplayData(
    request: NotebookOutputEventParams
): nbformat.IExecuteResult | nbformat.IDisplayData {
    if ('mime' in request) {
        // New API
        return {
            data: {
                [request.mime]: request.value
            },
            metadata: request.metadata || {},
            execution_count: null,
            output_type: request.metadata?.outputType || 'execute_result'
        };
    } else {
        // Old API
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const metadata: Record<string, any> = {};

        const oldRequest = (request as unknown) as OldNotebookOutputEventParams;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const outputMetadata = oldRequest.output.metadata as Record<string, any> | undefined;
        if (outputMetadata && outputMetadata[oldRequest.mimeType] && outputMetadata[oldRequest.mimeType].metadata) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Object.assign(metadata, outputMetadata[oldRequest.mimeType].metadata);
            if (oldRequest.mimeType in outputMetadata[oldRequest.mimeType].metadata) {
                Object.assign(metadata, outputMetadata[oldRequest.mimeType].metadata[oldRequest.mimeType]);
            }
        }

        return {
            data: {
                [oldRequest.mimeType]: oldRequest.output.data[oldRequest.mimeType]
            },
            metadata,
            execution_count: null,
            output_type: oldRequest.output.metadata?.custom?.vscode?.outputType || 'execute_result'
        };
    }
}
