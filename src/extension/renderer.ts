// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as path from 'path';
import {
    CellOutputKind,
    NotebookDocument,
    NotebookRenderRequest,
    NotebookOutputRenderer as VSCNotebookOutputRenderer,
    Uri
} from 'vscode';
import { ExtensionContext } from 'vscode';
import { JupyterNotebookRenderer } from './constants';

export class NotebookOutputRenderer implements VSCNotebookOutputRenderer {
    get preloads(): Uri[] {
        return [Uri.file(this.context.asAbsolutePath(path.join('out', 'client', 'renderers.js')))];
    }
    constructor(private readonly context: ExtensionContext) {}
    public render(_document: NotebookDocument, request: NotebookRenderRequest) {
        let outputToSend = { data: request.output, metadata: request.output.metadata?.custom } as any;
        if (request.output.outputKind === CellOutputKind.Rich && request.mimeType in request.output.data) {
            // tslint:disable-next-line: no-any
            const metadata: Record<string, any> = {};
            // Send metadata only for the mimeType we are interested in.
            const customMetadata = request.output.metadata?.custom;
            if (customMetadata) {
                if (customMetadata[request.mimeType]) {
                    metadata[request.mimeType] = customMetadata[request.mimeType];
                }
                if (customMetadata.needs_background) {
                    metadata.needs_background = customMetadata.needs_background;
                }
                if (customMetadata.unconfined) {
                    metadata.unconfined = customMetadata.unconfined;
                }
            }
            outputToSend = {
                // Send only what we need & ignore other mimeTypes.
                data: {
                    [request.mimeType]: request.output.data[request.mimeType]
                },
                metadata
            };
        }
        return `
            <script data-renderer="${JupyterNotebookRenderer}" data-mime-type="${request.mimeType}" data-output-id="${
            request.outputId
        }" type="application/json">
                ${JSON.stringify(outputToSend)}
            </script>
            `;
    }
}
