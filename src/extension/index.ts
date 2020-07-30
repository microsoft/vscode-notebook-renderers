// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ExtensionContext, notebook } from 'vscode';
import { NotebookOutputRenderer } from './renderer';

export function activate(context: ExtensionContext): void {
    context.subscriptions.push(
        notebook.registerNotebookOutputRenderer(
            'jupyter-notebook-renderer',
            {
                mimeTypes: [
                    'application/geo+json',
                    'application/vdom.v1+json',
                    'application/vnd.dataresource+json',
                    'application/vnd.plotly.v1+json',
                    'application/vnd.vega.v2+json',
                    'application/vnd.vega.v3+json',
                    'application/vnd.vega.v4+json',
                    'application/vnd.vega.v5+json',
                    'application/vnd.vegalite.v1+json',
                    'application/vnd.vegalite.v2+json',
                    'application/vnd.vegalite.v3+json',
                    'application/vnd.vegalite.v4+json',
                    'application/x-nteract-model-debug+json',
                    'image/gif',
                    'image/png',
                    'image/jpeg',
                    'text/latex',
                    'text/vnd.plotly.v1+html'
                ]
            },
            new NotebookOutputRenderer(context)
        )
    );
}
