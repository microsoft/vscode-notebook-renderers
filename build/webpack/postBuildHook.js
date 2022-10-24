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
                let requireFileContents = fs.readFileSync(requireFile).toString();
                if (!requireFileContents.includes(undefDeclaration)) {
                    throw new Error('Unable to update require.js');
                }
                // Ensure jQuery, require and define are globally available.
                const declarations = [
                    'globalThis.$ = $;',
                    'window.$ = $;',
                    'window.require=window.requirejs=requirejs; window.define=define;'
                ];
                requireFileContents = `${requireFileContents
                    .replace(invocationDeclaration, fixedInvocationDeclaration)
                    .replace(undefDeclaration, fixedUndefDeclaration)}\n\n`;
                const newContents = `${requireFileContents}\n\n\n${fs.readFileSync(jqueryFile).toString()}\n\n\n${fs
                    .readFileSync(file)
                    .toString()}\n\n\n${declarations.join('\n')}`;
                fs.writeFileSync(file, newContents);
            }
        });
    }
}

const invocationDeclaration = `}(this, (typeof setTimeout === 'undefined' ? undefined : setTimeout)));`;
const fixedInvocationDeclaration = `}(globalThis, (typeof setTimeout === 'undefined' ? undefined : setTimeout)));`;
const undefDeclaration = `                    localRequire.undef = function (id) {
                        //Bind any waiting define() calls to this context,
                        //fix for #408
                        takeGlobalQueue();

                        var map = makeModuleMap(id, relMap, true),
                            mod = getOwn(registry, id);

                        mod.undefed = true;
                        removeScript(id);

                        delete defined[id];
                        delete urlFetched[map.url];
                        delete undefEvents[id];

                        //Clean queued defines too. Go backwards
                        //in array so that the splices do not
                        //mess up the iteration.
                        eachReverse(defQueue, function(args, i) {
                            if (args[0] === id) {
                                defQueue.splice(i, 1);
                            }
                        });
                        delete context.defQueueMap[id];

                        if (mod) {
                            //Hold on to listeners in case the
                            //module will be attempted to be reloaded
                            //using a different config.
                            if (mod.events.defined) {
                                undefEvents[id] = mod.events;
                            }

                            cleanRegistry(id);
                        }
                    };`;
const fixedUndefDeclaration = `                    localRequire.undef = function (id) {
                        try {
                        //Bind any waiting define() calls to this context,
                        //fix for #408
                        takeGlobalQueue();

                        var map = makeModuleMap(id, relMap, true),
                            mod = getOwn(registry, id);

                        mod.undefed = true;
                        removeScript(id);

                        delete defined[id];
                        delete urlFetched[map.url];
                        delete undefEvents[id];

                        //Clean queued defines too. Go backwards
                        //in array so that the splices do not
                        //mess up the iteration.
                        eachReverse(defQueue, function(args, i) {
                            if (args[0] === id) {
                                defQueue.splice(i, 1);
                            }
                        });
                        delete context.defQueueMap[id];

                        if (mod) {
                            //Hold on to listeners in case the
                            //module will be attempted to be reloaded
                            //using a different config.
                            if (mod.events.defined) {
                                undefEvents[id] = mod.events;
                            }

                            cleanRegistry(id);
                        }
                        } catch (e) {
                          console.warn('require.undef in Notebook Renderer failed', id, e);
                        }
                    };`;

module.exports = PostBuildHookWebpackPlugin;
