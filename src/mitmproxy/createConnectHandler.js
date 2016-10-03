const {
    LOCAL_IP,
    MIDDLEWARE_API_sslConnectInterceptor
} = require('../config');
const net = require('net');
const url = require('url');
const utils = require('../utils');
const logger = require('../logger');


// create connectHandler function
function createConnectHandler(ssl, sslConnectInterceptor, middlewares, createFakeServerPromise) {

    let interceptors = utils.squeezePropsArray(middlewares, MIDDLEWARE_API_sslConnectInterceptor);
    interceptors.unshift(sslConnectInterceptor);

    // return
    return function connectHandler(req, cltSocket, head) {

        let shouldInterceptor = true;

        if (ssl) {
            for (var i = 0; i < interceptors.length; i++) {
                if (!interceptors[i](req, cltSocket, head)) {
                    shouldInterceptor = false;
                    break;
                }
            }
        }

        var srvUrl = url.parse(`https://${req.url}`);

        if (shouldInterceptor) {
            createFakeServerPromise(srvUrl.hostname, srvUrl.port).then((serverObj) => {
                connect(req, cltSocket, head, LOCAL_IP, serverObj.port);
            }, (e) => {
                logger.error(e);
            });
        } else {
            connect(req, cltSocket, head, srvUrl.hostname, srvUrl.port);
        }
    }

}

function connect(req, cltSocket, head, hostname, port) {
    // tunneling https
    var proxySocket = net.connect(port, hostname, () => {
        cltSocket.write('HTTP/1.1 200 Connection Established\r\n' +
            'Proxy-agent: node-mitmproxy\r\n' +
            '\r\n');
        proxySocket.write(head);
        proxySocket.pipe(cltSocket);
        cltSocket.pipe(proxySocket);
    });
    proxySocket.on('error', (e) => {
        logger.error(e);
    });
    return proxySocket;
}

module.exports = createConnectHandler;
