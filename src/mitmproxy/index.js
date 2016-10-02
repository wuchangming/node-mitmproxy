const config = require('../config');
const logger = require('../logger');
const http = reuqire('http');


const DEFAULT_PORT = config.DEFAULT_PORT;
const DEFAULT_CA_CERT_PATH = config.DEFAULT_CA_CERT_PATH;
const DEFAULT_CA_KEY_PATH = config.DEFAULT_CA_KEY_PATH;

exports = mitmproxy;

/**
 * create a mitmproxy server
 *
 * @param  {Object} options
 * {
 *   port
 *   caCertPath
 *   caKeyPath
 *   ssl
 *   middlewares
 *   externalProxy
 *   sslConnectInterceptor
 *   requestInterceptor
 *   responseInterceptor
 *   mapLocalList
 *   silence
 *   outputCertFiles
 *   outputCertFilesPath
 * }
 *
 * @return {Object} mitmproxy
 */
mitmproxy.createProxy = function (options) {
    options = Object.assign({
        port: DEFAULT_PORT,
        caCertPath: DEFAULT_CA_CERT_PATH,
        caKeyPath: DEFAULT_CA_KEY_PATH,
        ssl: false,
        silence: false,
        outputCertFiles: false,
        outputCertFilesPath: DEFAULT_OUTPUT_CERT_FILES_PATH
    }, options);






}
