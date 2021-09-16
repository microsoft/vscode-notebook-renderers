// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Event, EventEmitter, ExtensionContext, notebooks, extensions, NotebookEditor } from 'vscode';
import { OpenImageInPlotViewer, SaveImageAs, IsJupyterExtensionInstalled } from './constants';

export async function activate(
    context: ExtensionContext
): Promise<{
    onDidReceiveMessage: Event<{ editor: NotebookEditor; message: OpenImageInPlotViewer | SaveImageAs }>;
}> {
    const onDidReceiveMessage = new EventEmitter<{
        editor: NotebookEditor;
        message: OpenImageInPlotViewer | SaveImageAs;
    }>();
    const messaging = notebooks.createRendererMessaging('jupyter-notebook-renderer');
    context.subscriptions.push(
        messaging.onDidReceiveMessage(({ editor, message }) => {
            const msg = message as OpenImageInPlotViewer | SaveImageAs | IsJupyterExtensionInstalled;
            if (!msg.type) {
                return;
            }
            if (msg.type === 'isJupyterExtensionInstalled') {
                const isJupyterExtAvailable = extensions.getExtension('ms-toolsai.jupyter');
                void messaging.postMessage(
                    <IsJupyterExtensionInstalled>{
                        type: 'isJupyterExtensionInstalled',
                        response: isJupyterExtAvailable
                    },
                    editor
                );
                return;
            }
            onDidReceiveMessage.fire({ editor, message: msg });
        })
    );

    return {
        onDidReceiveMessage: onDidReceiveMessage.event
    };
}
