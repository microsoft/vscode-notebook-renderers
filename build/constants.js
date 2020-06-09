// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const path = require('path');
exports.ExtensionRootDir = path.dirname(__dirname);
exports.isWindows = /^win/.test(process.platform);
exports.isCI = process.env.TF_BUILD !== undefined;
