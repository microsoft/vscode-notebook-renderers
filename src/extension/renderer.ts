// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as path from 'path';
import { v4 as uuid } from 'uuid';
import {
    CellOutput,
    CellOutputKind,
    NotebookDocument,
    NotebookOutputRenderer as VSCNotebookOutputRenderer,
    Uri
} from 'vscode';
import { EXTENSION_ROOT_DIR } from './constants';

export class NotebookOutputRenderer implements VSCNotebookOutputRenderer {
    get preloads(): Uri[] {
        return [Uri.file(path.join(EXTENSION_ROOT_DIR, 'out', 'client', 'renderers.js'))];
    }

    public render(_document: NotebookDocument, output: CellOutput, mimeType: string) {
        let outputToSend = output;
        if (output.outputKind === CellOutputKind.Rich && mimeType in output.data) {
            outputToSend = {
                ...output,
                // Send only what we need & ignore other mimeTypes.
                data: {
                    [mimeType]: output.data[mimeType]
                }
            };
        }
        const id = uuid();
        return `
            <script id="${id}" data-mime-type="${mimeType}" type="application/vscode-jupyter+json">
                ${JSON.stringify(outputToSend)}
            </script>
            <script type="text/javascript">
                // Possible pre-render script has not yet loaded.
                if (window['vscode-jupyter']){
                    try {
                        const tag = document.getElementById("${id}");
                        window['vscode-jupyter']['renderOutput'](tag);
                    } catch (ex){
                        console.error("Failed to render ${mimeType}", ex);
                    }
                }
            </script>
            `;
    }
}
