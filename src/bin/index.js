#!/usr/bin/env node
require('babel-polyfill');
const mitmproxy = require('../mitmproxy/index');
const program = require('commander');
const packageJson = require('../../package.json');
const tlsUtils = require('../tls/tlsUtils');
const fs = require('fs');
const path = require('path');
const colors = require('colors');

fs.existsSync = fs.existsSync || path.existsSync;

program
.version(packageJson.version)
.option('-c, --config [value]', 'config file path')
.parse(process.argv);

console.log(program.config);

var configPath = path.resolve(program.config);

if (fs.existsSync(configPath)) {

    var configObject = require(configPath);

    if (typeof configObject !== 'object') {
        console.error(colors.red(`Config Error in ${configPath}`));
    } else {
        mitmproxy.createProxy(configObject);
    }
} else {
    console.error(colors.red(`Can not find \`config file\` file: ${configPath}`));
}
