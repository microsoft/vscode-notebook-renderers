/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type * as MarkdownIt from 'markdown-it';
import type { RendererContext } from 'vscode-notebook-renderer';

interface MarkdownItRenderer {
    extendMarkdownIt(fn: (md: MarkdownIt) => void): void;
}
const css = `
<style>
/*
Found that the colors of the alert boxes do not change with different themes in jlab.
Hence hardcoded them here.
*/

.alert {
    width: auto;
    padding: 1em;
    margin-top: 1em;
    margin-bottom: 1em;
	border-style: solid;
	border-width: 1px;
}
.alert > *:last-child {
    margin-bottom: 0;
}
#preview > .alert:last-child {
    /* Prevent this being set to zero by the default notebook stylesheet */
    padding-bottom: 1em;
}

.alert-success {
    background-color: rgb(200,230,201);
    color: rgb(27,94,32);
}
.alert-info {
    background-color: rgb(178,235,242);
    color: rgb(0,96,100);
}
.alert-warning {
    background-color: rgb(255,224,178);
    color: rgb(230,81,0);
}
.alert-danger {
    background-color: rgb(255,205,210);
    color: rgb(183,28,28);
}
</style>
`;

export async function activate(ctx: RendererContext<void>) {
    const markdownItRenderer = (await ctx.getRenderer('vscode.markdown-it-renderer')) as MarkdownItRenderer | undefined;
    if (!markdownItRenderer) {
        throw new Error(`Could not load 'vscode.markdown-it-renderer'`);
    }

    markdownItRenderer.extendMarkdownIt((md: MarkdownIt) => {
        const original = md.render.bind(md);
        md.render = (src: string) => `${css}${original(src)}`;
    });
}
