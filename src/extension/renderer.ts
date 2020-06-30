// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as path from 'path';
import { v4 as uuid } from 'uuid';
import {
    CellOutputKind,
    NotebookDocument,
    NotebookRenderRequest,
    NotebookOutputRenderer as VSCNotebookOutputRenderer,
    Uri
} from 'vscode';
import { EXTENSION_ROOT_DIR } from './constants';

export class NotebookOutputRenderer implements VSCNotebookOutputRenderer {
    get preloads(): Uri[] {
        return [Uri.file(path.join(EXTENSION_ROOT_DIR, 'out', 'client', 'renderers.js'))];
    }

    public render(_document: NotebookDocument, request: NotebookRenderRequest) {
        let outputToSend = request.output;
        if (request.output.outputKind === CellOutputKind.Rich && request.mimeType in request.output.data) {
            outputToSend = {
                ...request.output,
                // Send only what we need & ignore other mimetypes.
                data: {
                    [request.mimeType]: request.output.data[request.mimeType]
                }
            };
        }
        const id = uuid();
        return `
            <script id="${id}" data-mime-type="${request.mimeType}" type="application/vscode-jupyter+json">
                ${JSON.stringify(outputToSend)}
            </script>
            <script type="text/javascript">
                // Possible pre-render script has not yet loaded.
                if (window['vscode-jupyter']){
                    try {
                        const tag = document.getElementById("${id}");
                        window['vscode-jupyter']['renderOutput'](tag);
                    } catch (ex){
                        console.error("Failed to render ${request.mimeType}", ex);
                    }
                }
            </script>
            `;
    }
}
