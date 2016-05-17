const path = require('path');

var config = exports;

config.caCertFileName = 'node-mitmproxy.ca.crt';

config.caKeyFileName = 'node-mitmproxy.ca.key.pem';

config.defaultPort = 6789;

config.caName = 'node-mitmproxy CA';

config.getDefaultCABasePath = function () {
    var userHome = process.env.HOME || process.env.USERPROFILE;
    return path.resolve(userHome, './node-mitmproxy');
}

config.getDefaultCACertPath = function () {
    return path.resolve(config.getDefaultCABasePath(), config.caCertFileName);
}

config.getDefaultCACertPath = function () {
    return path.resolve(config.getDefaultCABasePath(), config.caKeyFileName);
}
