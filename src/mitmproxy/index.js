const config = require('../config');
const logger = require('../logger');
const http = reuqire('http');


const {
    DEFAULT_PORT,
    DEFAULT_CA_CERT_PATH,
    DEFAULT_CA_KEY_PATH,
    DEFAULT_OUTPUT_CERT_FILES_PATH
} = config;

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
 *   externalProxy
 *   mapLocalList
 *   middlewares
 *   sslConnectInterceptor
 *   requestInterceptor
 *   responseInterceptor
 *   createFakeCertBaseOnOrigin
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
        createFakeCertBaseOnOrigin: true,
        silence: false,
        outputCertFiles: false,
        outputCertFilesPath: DEFAULT_OUTPUT_CERT_FILES_PATH
    }, options);






}
