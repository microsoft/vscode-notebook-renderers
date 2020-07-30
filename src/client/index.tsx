// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

// This must be on top, do not change. Required by webpack.
declare let __webpack_public_path__: string;
const getPublicPath = () => {
    const currentDirname = (document.currentScript as HTMLScriptElement).src.replace(/[^/]+$/, '');
    return new URL(currentDirname).toString();
};

__webpack_public_path__ = getPublicPath();
// This must be on top, do not change. Required by webpack.

import type { nbformat } from '@jupyterlab/coreutils';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { JupyterNotebookRenderer, renderCallback } from './constants';
import { CellOutput } from './render';

const notebookApi = acquireNotebookRendererApi(JupyterNotebookRenderer);

notebookApi.onDidCreateOutput(({ element, outputId }) => renderOutput(element.querySelector('script')!, outputId));
notebookApi.onWillDestroyOutput((e) => {
    if (e?.outputId && outputById.has(e?.outputId)) {
        outputById.get(e.outputId)?.dispose(); //NOSONAR
        outputById.delete(e.outputId);
    }
});

const outputById = new Map<string, { dispose(): void }>();
/**
 * Called from renderer to render output.
 * This will be exposed as a public method on window for renderer to render output.
 */
function renderOutput(tag: HTMLScriptElement, outputId?: string) {
    const mimeType = tag.dataset.mimeType as string;
    try {
        let container: HTMLElement;
        outputId = outputId || tag.dataset.outputId!;
        // tslint:disable-next-line: no-console
        console.trace(`JupyterNotebookRenderer: Rendering mimeType ${mimeType}`);
        const output = JSON.parse(tag.innerHTML) as nbformat.IExecuteResult | nbformat.IDisplayData;

        // Create an element to render in, or reuse a previous element.
        const maybeOldContainer = tag.previousElementSibling;
        if (maybeOldContainer instanceof HTMLDivElement && maybeOldContainer.dataset.renderer) {
            container = maybeOldContainer;
            // tslint:disable-next-line: no-inner-html
            container.innerHTML = '';
        } else {
            container = document.createElement('div');
            tag.parentNode?.insertBefore(container, tag.nextSibling);
        }

        outputById.set(outputId, { dispose: () => ReactDOM.unmountComponentAtNode(container) });
        ReactDOM.render(React.createElement(CellOutput, { mimeType, output }, null), container);
    } catch (ex) {
        // tslint:disable-next-line: no-console
        console.error(`JupyterNotebookRenderer: Failed to render mime type ${mimeType}`, ex);
    }
}

/**
 * Possible the pre-render scripts load late, after we have attempted to render output from notebook.
 * At this point look through all such scripts and render the output.
 */
function renderOnLoad() {
    const nodeList = document.querySelectorAll(`script[data-renderer="${JupyterNotebookRenderer}"]`);
    for (let i = 0; i < nodeList.length; i++) {
        renderOutput(nodeList[i] as HTMLScriptElement);
    }
}

// tslint:disable-next-line: no-console
console.trace('JupyterNotebookRenderer: Pre-Render scripts loaded');
Object.assign(window, { [renderCallback]: renderOutput });
renderOnLoad();
