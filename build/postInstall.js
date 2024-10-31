// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const path = require('path');
const fs = require('fs');

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

fixPlotlyRenderer();
