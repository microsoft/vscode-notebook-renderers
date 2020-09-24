// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import type { nbformat } from '@jupyterlab/coreutils';
import type { JSONObject } from '@phosphor/coreutils';
import * as React from 'react';
import { concatMultilineStringOutput } from './helpers';
import { fixLatexEquations } from './latexManipulation';
import { fixMarkdown } from './markdownManipulation';
import { getTransform } from './transforms';

export interface ICellOutputProps {
    output: nbformat.IExecuteResult | nbformat.IDisplayData;
    mimeType: string;
}

export class CellOutput extends React.Component<ICellOutputProps> {
    constructor(prop: ICellOutputProps) {
        super(prop);
    }
    public render() {
        const mimeBundle = this.props.output.data as nbformat.IMimeBundle; // NOSONAR
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        let data: nbformat.MultilineString | JSONObject = mimeBundle[this.props.mimeType!];

        // Fixup latex to make sure it has the requisite $$ around it
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (this.props.mimeType! === 'text/latex') {
            data = fixLatexEquations(concatMultilineStringOutput(data as nbformat.MultilineString), true);
        }

        switch (this.props.mimeType) {
            case 'text/latex':
                return this.renderLatex(data);
            case 'image/png':
            case 'image/jpeg':
                return this.renderImage(mimeBundle, this.props.output.metadata);

            default:
                return this.renderOutput(data, this.props.mimeType);
        }
    }
    /**
     * Custom rendering of image/png and image/jpeg to handle custom Jupyter metadata.
     * Behavior adopted from Jupyter lab.
     */
    private renderImage(mimeBundle: nbformat.IMimeBundle, metadata: Record<string, unknown> = {}) {
        const mimeType = 'image/png' in mimeBundle ? 'image/png' : 'image/jpeg';

        const imgStyle: Record<string, string | number> = {};
        const divStyle: Record<string, string | number> = { overflow: 'scroll' }; // This is the default style used by Jupyter lab.
        const imgSrc = `data:${mimeType};base64,${mimeBundle[mimeType]}`;

        if (typeof metadata.needs_background === 'string') {
            divStyle.backgroundColor = metadata.needs_background === 'light' ? 'white' : 'black';
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imageMetadata = metadata[mimeType] as Record<string, any> | undefined;
        if (imageMetadata) {
            if (imageMetadata.height) {
                imgStyle.height = imageMetadata.height;
            }
            if (imageMetadata.width) {
                imgStyle.width = imageMetadata.width;
            }
            if (imageMetadata.unconfined === true) {
                imgStyle.maxWidth = 'none';
            }
        }

        // Hack, use same classes as used in VSCode for images (keep things as similar as possible).
        // This is to maintain consistently in displaying images (if we hadn't used HTML).
        // See src/vs/workbench/contrib/notebook/browser/view/output/transforms/richTransform.ts
        return (
            <div className={'display'} style={divStyle}>
                <img src={imgSrc} style={imgStyle}></img>
            </div>
        );
    }
    private renderOutput(data: nbformat.MultilineString | JSONObject, mimeType?: string) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unused-vars, no-unused-vars
        const Transform = getTransform(this.props.mimeType!);
        const divStyle: React.CSSProperties = {
            backgroundColor: mimeType && isAltairPlot(mimeType) ? 'white' : undefined
        };
        return (
            <div style={divStyle}>
                <Transform data={data} />
            </div>
        );
    }
    private renderLatex(data: nbformat.MultilineString | JSONObject) {
        // Fixup latex to make sure it has the requisite $$ around it
        data = fixMarkdown(concatMultilineStringOutput(data as nbformat.MultilineString), true);
        return this.renderOutput(data);
    }
}

function isAltairPlot(mimeType: string) {
    return mimeType.includes('application/vnd.vega');
}
