const {
    LOCAL_IP,
    MIDDLEWARE_API_sslConnectInterceptor
} = require('../config');
const net = require('net');
const url = require('url');
const utils = require('../utils')

// create connectHandler function
module.exports = function createConnectHandler(sslConnectInterceptor, middlewares) {

    let interceptors = utils.squeezePropsArray(middlewares, MIDDLEWARE_API_sslConnectInterceptor);
    interceptors.unshift(sslConnectInterceptor);

    // return
    return function connectHandler (req, cltSocket, head) {

        var srvUrl = url.parse(`https://${req.url}`);

        if (typeof sslConnectInterceptor === 'function' && sslConnectInterceptor.call(null, req, cltSocket, head)) {
            fakeServerCenter.getServerPromise(srvUrl.hostname, srvUrl.port).then((serverObj) => {
                connect(req, cltSocket, head, LOCAL_IP, serverObj.port);
            }, (e) => {
                console.error(e);
            });
        } else {
            connect(req, cltSocket, head, srvUrl.hostname, srvUrl.port);
        }
    }

}

function connect (req, cltSocket, head, hostname, port) {
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
        console.log(colors.red(e));
    });
    return proxySocket;
}
