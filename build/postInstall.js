// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const path = require('path');
const fs = require('fs');

function fixJupyterLabRenderers() {
    const filePath = path.join(__dirname, '..', 'node_modules/@jupyterlab/rendermime/lib/renderers.js');
    const textToReplace = `import marked from 'marked'`;
    const textToReplaceWith = `import { marked } from 'marked'`;
    const fileContents = fs.readFileSync(filePath, 'utf8').toString();
    if (fileContents.indexOf(textToReplace) === -1 && fileContents.indexOf(textToReplaceWith) === -1) {
        throw new Error('Unable to find Jupyter marked usage to replace!');
    }
    fs.writeFileSync(filePath, fileContents.replace(textToReplace, textToReplaceWith));
}

fixJupyterLabRenderers();
