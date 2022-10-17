// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const path = require('path');
const fs = require('fs');

class PostBuildHookWebpackPlugin {
    apply(compiler) {
        compiler.hooks.assetEmitted.tap('MyExampleWebpackPlugin', (compilation) => {
            if (compilation === 'preload.js') {
                const file = path.join(__dirname, '..', '..', 'out', 'client_renderer', 'preload.js');
                if (!fs.existsSync(file)) {
                    throw new Error(`PostBuildHookWebpackPlugin failed, file does not exist (${file})`);
                }
                const requireFile = path.join(__dirname, '..', '..', 'node_modules', 'requirejs', 'require.js');
                const jqueryFile = path.join(__dirname, '..', '..', 'node_modules', 'jquery', 'dist', 'jquery.min.js');
                const newContents = `${fs.readFileSync(requireFile).toString()}\n\n\n${fs
                    .readFileSync(jqueryFile)
                    .toString()}\n\n\n${fs.readFileSync(file).toString()}`;
                fs.writeFileSync(file, newContents);
            }
        });
    }
}

module.exports = PostBuildHookWebpackPlugin;
