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

function fixPlotlyRenderer() {
    const filePath = path.join(__dirname, '..', 'node_modules/@nteract/transform-plotly/lib/index.js');
    const textsToReplace = [
        `this.Plotly.newPlot(this.plotDiv, figure.data, figure.layout);`,
        `const { data = {}, layout = {} } = figure;`,
        `return { data, layout };`
    ];
    const textsToReplaceWith = [
        `this.Plotly.newPlot(this.plotDiv, figure); //Replaced by postinstall`,
        `const { data = {}, layout = {}, frames = {}, config = {} } = figure;`,
        `return { data, layout, config, frames };`
    ];
    const fileContents = fs.readFileSync(filePath, 'utf8').toString();
    if (fileContents.indexOf(textsToReplace[0]) === -1 && fileContents.indexOf(textsToReplaceWith[0]) === -1) {
        throw new Error('Unable to find plotly fixup');
    }
    let replacedFileContents = fileContents;
    textsToReplace.forEach((s, i) => {
        replacedFileContents = replacedFileContents.replace(s, textsToReplaceWith[i]);
    });
    fs.writeFileSync(filePath, replacedFileContents);
}

fixJupyterLabRenderers();
fixPlotlyRenderer();
