// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import type { nbformat } from '@jupyterlab/coreutils';
import type { JSONObject } from '@phosphor/coreutils';
import * as React from 'react';
import type { RendererContext } from 'vscode-notebook-renderer';
import { concatMultilineString } from './helpers';
import { fixMarkdown } from './markdownManipulation';
import { getTransform } from './transforms';

export interface ICellOutputProps {
    output: nbformat.IExecuteResult | nbformat.IDisplayData;
    mimeType: string;
    ctx: RendererContext<unknown>;
    outputId: string;
}

export class CellOutput extends React.Component<ICellOutputProps> {
    constructor(prop: ICellOutputProps) {
        super(prop);
    }
    public render() {
        const mimeBundle = this.props.output.data as nbformat.IMimeBundle; // NOSONAR
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        let data: nbformat.MultilineString | JSONObject = mimeBundle[this.props.mimeType!];

        // For un-executed output we might get text or svg output as multiline string arrays
        // we want to concat those so we don't display a bunch of weird commas as we expect
        // Single strings in our output
        if (Array.isArray(data)) {
            data = concatMultilineString(data as nbformat.MultilineString, true);
        }

        switch (this.props.mimeType) {
            case 'text/latex':
                return this.renderLatex(data);
            default:
                return this.renderOutput(data, this.props.mimeType);
        }
    }
    private renderOutput(data: nbformat.MultilineString | JSONObject, mimeType?: string) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unused-vars, no-unused-vars, @typescript-eslint/no-explicit-any
        const Transform: any = getTransform(this.props.mimeType!);
        const vegaPlot = mimeType && isVegaPlot(mimeType);
        const divStyle: React.CSSProperties = {
            backgroundColor: vegaPlot ? 'white' : undefined
        };
        if (vegaPlot) {
            // Vega library expects data to be passed as serialized JSON instead of a native
            // JS object.
            data = typeof data === 'string' ? data : JSON.stringify(data);
        }
        return (
            <div style={divStyle}>
                <Transform data={data} onError={console.error} />
            </div>
        );
    }
    private renderLatex(data: nbformat.MultilineString | JSONObject) {
        // Fixup latex to make sure it has the requisite $$ around it
        data = fixMarkdown(concatMultilineString(data as nbformat.MultilineString, true), true);
        return this.renderOutput(data);
    }
}

function isVegaPlot(mimeType: string) {
    return mimeType.includes('application/vnd.vega');
}
