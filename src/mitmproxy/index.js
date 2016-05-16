const tlsUtils = require('../tls/tlsUtils');
const http = require('http');
const config = require('../common/config');
const colors = require('colors');
const createRequestHandler = require('./createRequestHandler');
const createConnectHandler = require('./createConnectHandler');
const createFakeServerCenter = require('./createFakeServerCenter');
const createUpgradeHandler = require('./createUpgradeHandler');


module.exports = {
    createProxy({
        port = 6789,
        caBasePath = config.getDefaultCABasePath(),
        sslConnectInterceptor,
        requestInterceptor,
        responseInterceptor,
        getCertSocketTimeout
    }) {
        port = ~~port;
        var requestHandler = createRequestHandler(
            requestInterceptor,
            responseInterceptor
        );

        var upgradeHandler = createUpgradeHandler();

        var fakeServersCenter = createFakeServerCenter({
            caBasePath,
            requestHandler,
            upgradeHandler,
            getCertSocketTimeout
        });

        var connectHandler = createConnectHandler(
            sslConnectInterceptor,
            fakeServersCenter
        );

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
                var ssl = false;
                upgradeHandler(req, socket, head, ssl);
            });
        });
    },
    createCA(caBasePath = config.getDefaultCABasePath()) {
        tlsUtils.initCA(caBasePath);
    }
}
