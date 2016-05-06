const tlsUtils = require('../tls/tlsUtils');
const http = require('http');
const config = require('../common/config');
const colors = require('colors');
const createRequestHandler = require('./createRequestHandler');
const createConnectHandler = require('./createConnectHandler');
const createFakeServerCenter = require('./createFakeServerCenter');

module.exports = {
    createProxy({
        port = 6789,
        caBasePath = config.getDefaultCABasePath(),
        sslConnectInterceptor,
        requestInterceptor,
        responseInterceptor
    }) {
        port = ~~port;
        var requestHandler = createRequestHandler(requestInterceptor, responseInterceptor);

        var fakeServersCenter = createFakeServerCenter({
            caBasePath,
            requestHandler
        });

        var connectHandler = createConnectHandler(sslConnectInterceptor, fakeServersCenter);

        var server = new http.Server();
        server.listen(port, () => {
            console.log(colors.green(`node-mitmproxy启动端口: ${port}`));
            server.on('error', (e) => {
                console.error(colors.red(e));
            });
            server.on('request', (req, res) => {
                var ssl = false;
                requestHandler(req, res, ssl);
            });
            // tunneling for https
            server.on('connect', (req, cltSocket, head) => {
                connectHandler(req, cltSocket, head);
            });
            // TODO: handler WebSocket
            server.on('upgrade', function(req, socket, head) {
                socket.write('HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
                'Upgrade: WebSocket\r\n' +
                'Connection: Upgrade\r\n' +
                '\r\n');
                console.log(colors.yellow('暂未支持代理WebSocket！'));
                socket.pipe(socket);
            });
        });
    },
    createCA(caBasePath = config.getDefaultCABasePath()) {
        tlsUtils.initCA(caBasePath);
    }
}
