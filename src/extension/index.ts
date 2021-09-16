// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ExtensionContext } from 'vscode';
import * as path from 'path';

export function activate(context: ExtensionContext): { rendererPath: string } {
    return {
        rendererPath: path.join(context.extensionPath, 'out', 'client_renderer', 'renderers.js')
    };
}

export function deactivate(): void {
    // Noop.
}
