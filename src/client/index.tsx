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
import './index.css';
import type * as nbformat from '@jupyterlab/nbformat';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { CellOutput } from './render';
import { ActivationFunction, OutputItem, RendererContext } from 'vscode-notebook-renderer';

export const activate: ActivationFunction = (ctx: RendererContext<unknown>) => {
    console.log('Jupyter Notebook Renderer activated');
    return {
        renderOutputItem(outputItem: OutputItem, element: HTMLElement) {
            renderOutput(outputItem, element, ctx);
        }
    };
};

/**
 * Called from renderer to render output.
 * This will be exposed as a public method on window for renderer to render output.
 */
function renderOutput(outputItem: OutputItem, element: HTMLElement, ctx: RendererContext<unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mimeString = outputItem.mime || (outputItem as any).mimeType;
    try {
        if (!ctx.workspace.isTrusted) {
            return;
        }
        console.log('request', outputItem);
        const output = convertVSCodeOutputToExecuteResultOrDisplayData(outputItem);
        console.log(`Rendering mimeType ${mimeString}`, output);

        ReactDOM.render(
            React.createElement(CellOutput, { mimeType: mimeString, output, ctx, outputId: outputItem.id }, null),
            element
        );
    } catch (ex) {
        console.error(`Failed to render mime type ${mimeString}`, ex);
    }
}

function convertVSCodeOutputToExecuteResultOrDisplayData(
    outputItem: OutputItem
): nbformat.IExecuteResult | nbformat.IDisplayData {
    const isImage =
        outputItem.mime.toLowerCase().startsWith('image/') && !outputItem.mime.toLowerCase().includes('svg');
    // We add a metadata item `__isJson` to tell us whether the data is of type JSON or not.
    const isJson = (outputItem.metadata as Record<string, unknown>)?.__isJson === true;
    const value = isImage ? outputItem.blob() : isJson ? outputItem.json() : outputItem.text();
    return {
        data: {
            [outputItem.mime]: value
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: (outputItem.metadata as any) || {},
        execution_count: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        output_type: (outputItem.metadata as any)?.outputType || 'execute_result'
    };
}
