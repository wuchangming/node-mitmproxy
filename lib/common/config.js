'use strict';

var path = require('path');

var config = exports;
config.caCertFileName = 'node-mitmproxy.ca.crt';

config.caKeyFileName = 'node-mitmproxy.ca.key.pem';

config.caName = 'node-mitmproxy CA';

config.getDefaultCABasePath = function () {
    var userHome = process.env.HOME || process.env.USERPROFILE;
    return path.resolve(userHome, './node-mitmproxy');
};
// console log 颜色
config.logColor = {
    FgRed: "\x1b[31m",
    FgGreen: "\x1b[32m",
    Reset: "\x1b[0m"
};