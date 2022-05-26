// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import type * as nbformat from '@jupyterlab/nbformat';

export function concatMultilineString(str: nbformat.MultilineString, trim?: boolean): string {
    const nonLineFeedWhiteSpaceTrim = /(^[\t\f\v\r ]+|[\t\f\v\r ]+$)/g; // Local var so don't have to reset the lastIndex.
    if (Array.isArray(str)) {
        let result = '';
        for (let i = 0; i < str.length; i += 1) {
            const s = str[i];
            if (i < str.length - 1 && !s.endsWith('\n')) {
                result = result.concat(`${s}\n`);
            } else {
                result = result.concat(s);
            }
        }

        // Just trim whitespace. Leave \n in place
        return trim ? result.replace(nonLineFeedWhiteSpaceTrim, '') : result;
    }
    return trim ? str.toString().replace(nonLineFeedWhiteSpaceTrim, '') : str.toString();
}
