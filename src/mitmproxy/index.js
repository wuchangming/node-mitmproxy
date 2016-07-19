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
        port = config.defaultPort,
        caCertPath,
        caKeyPath,
        sslConnectInterceptor,
        requestInterceptor,
        responseInterceptor,
        getCertSocketTimeout = 1 * 1000,
        middlewares = [],
        externalProxy
    }) {

        // Don't reject unauthorized
        process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'

        if (!caCertPath && !caKeyPath) {
            var rs = this.createCA();
            caCertPath = rs.caCertPath;
            caKeyPath = rs.caKeyPath;
            if (rs.create) {
                console.log(colors.cyan(`CA Cert saved in: ${caCertPath}`));
                console.log(colors.cyan(`CA private key saved in: ${caKeyPath}`));
            }
        }

        port = ~~port;
        var requestHandler = createRequestHandler(
            requestInterceptor,
            responseInterceptor,
            middlewares,
            externalProxy
        );

        var upgradeHandler = createUpgradeHandler();

        var fakeServersCenter = createFakeServerCenter({
            caCertPath,
            caKeyPath,
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
        return tlsUtils.initCA(caBasePath);
    }
}
