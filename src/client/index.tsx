// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// This must be on top, do not change. Required by webpack.
// eslint-disable-next-line no-unused-vars
declare let __webpack_public_path__: string;
const getPublicPath = () => {
    const currentDirname = (document.currentScript as HTMLScriptElement).src.replace(/[^/]+$/, '');
    return new URL(currentDirname).toString();
};

// eslint-disable-next-line prefer-const
__webpack_public_path__ = getPublicPath();
// This must be on top, do not change. Required by webpack.

import { nbformat } from '@jupyterlab/coreutils';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { CellOutput } from './render';

/**
 * Called from renderer to render output.
 * This will be exposed as a public method on window for renderer to render output.
 */
function renderOutput(tag: HTMLScriptElement) {
    let container: HTMLElement;
    const mimeType = tag.dataset.mimeType as string;
    try {
        const output = JSON.parse(tag.innerHTML) as nbformat.IExecuteResult | nbformat.IDisplayData;
        console.log(`Rendering mimeType ${mimeType}`);

        // Create an element to render in, or reuse a previous element.
        if (tag.nextElementSibling instanceof HTMLDivElement) {
            container = tag.nextElementSibling;
            container.innerHTML = '';
        } else {
            container = document.createElement('div');
            tag.parentNode?.insertBefore(container, tag.nextSibling); // NOSONAR
        }
        tag.parentElement?.removeChild(tag); // NOSONAR

        ReactDOM.render(React.createElement(CellOutput, { mimeType, output }, null), container);
    } catch (ex) {
        console.error(`Failed to render mime type ${mimeType}`, ex);
    }
}

/**
 * Possible the pre-render scripts load late, after we have attempted to render output from notebook.
 * At this point look through all such scripts and render the output.
 */
function renderOnLoad() {
    document
        .querySelectorAll<HTMLScriptElement>('script[type="application/vscode-jupyter+json"]')
        .forEach(renderOutput);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function initialize(global: Record<string, any>) {
    // Expose necessary hooks for client renderer to render output.
    Object.assign(global, { 'vscode-jupyter': { renderOutput } });
    // Possible this (pre-render script loaded after notebook attempted to render something).
    // At this point we need to go and render the existing output.
    renderOnLoad();
}

console.log('Pre-Render scripts loaded');
initialize(window);
