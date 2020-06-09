// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import type { nbformat } from '@jupyterlab/coreutils';
import type { JSONObject } from '@phosphor/coreutils';
import * as React from 'react';
import { concatMultilineStringOutput } from './helpers';
import { fixLatexEquations } from './latexManipulation';
import { getTransform } from './transforms';

export interface ICellOutputProps {
    output: nbformat.IOutput;
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

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unused-vars, no-unused-vars
        const Transform = getTransform(this.props.mimeType!);
        return (
            <div>
                <Transform data={data} />
            </div>
        );
    }
}
