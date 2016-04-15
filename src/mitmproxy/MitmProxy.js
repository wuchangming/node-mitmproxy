const tlsUtils = require('../tls/tlsUtils');
const http = require('http');
const path = require('path');
const https = require('https');
const net = require('net');
const url = require('url');
const forge = require('node-forge');
const config = require('../common/config');
const FakeServersCenter = require('../tls/FakeServersCenter');
const domain = require('domain');
const fs = require('fs');
const mkdirp = require('mkdirp');


var pki = forge.pki;
var logColor = config.logColor;

const localIP = '127.0.0.1';

var d = domain.create();
d.on('error', function (err) {
    console.log(err.message);
});

var nope = function () {

}

module.exports = class MitmProxy {
    constructor({port = 6789,
        CAPath = config.getDefaultCABasePath(),
        ssl = false,
        preInterceptor = nope,
        postInterceptor = nope,
        sslConnectInterceptor = nope,
        caBasePath
    }){

        this.preInterceptor = preInterceptor;
        this.postInterceptor = postInterceptor;
        this.sslConnectInterceptor = sslConnectInterceptor;
        this.ssl = ssl;

        // if (ssl) {
        this.__initCA(caBasePath);
        // }

        if (this.ssl) {
            this.fakeServersCenter = new FakeServersCenter({
                caCert: this.caCert,
                caKey: this.caKey,
                maxLength: 100,
                requestCB: (req, res) => {
                    this.__requestHandler(req, res, true);
                },
                errorCB: nope
            });
        }

        var server = new http.Server();
        server.listen(port, () => {
            console.log(logColor.FgGreen + '%s' + logColor.Reset, `node-mitmproxy启动端口: ${port}`);
            server.on('error', (e) => {
                console.error(e);
            });
            server.on('request', (req, res) => {
                d.run(() => {
                    var isHttps = false;
                    var proxyRequest = this.__requestHandler(req, res, isHttps);
                });
            });
            // tunneling for https
            server.on('connect', (req, cltSocket, head) => {
                d.run(() => {
                    var proxySocket = this.__connectHandler(req, cltSocket, head);
                });
            });
        });
    }
    __initCA (basePath = config.getDefaultCABasePath()) {
        var caCertPath = path.resolve(basePath, config.caCertFileName);
        var caKeyPath = path.resolve(basePath, config.caKeyFileName);
        try {
            fs.accessSync(caCertPath, fs.F_OK);
            fs.accessSync(caKeyPath, fs.F_OK);
            var caCertPem = fs.readFileSync(caCertPath);
            var caKeyPem = fs.readFileSync(caKeyPath);
            this.caCert = forge.pki.certificateFromPem(caCertPem);
            this.caKey = forge.pki.privateKeyFromPem(caKeyPem);
            // has exist
        } catch (e) {
            var caObj = tlsUtils.createCA(config.caName);
            this.caCert = caObj.cert;
            this.cakey = caObj.key;
            var certPem = pki.certificateToPem(this.caCert);

            var keyPem = pki.privateKeyToPem(this.cakey);

            mkdirp(path.dirname(caCertPath), function (err) {
                if (err) return cb(err);

                fs.writeFile(caCertPath, certPem, (err) => {
                    if (err) throw err;
                    console.log(`CA Cert saved in: ${caCertPath}`);
                });

                fs.writeFile(caKeyPath, keyPem, (err) => {
                    if (err) throw err;
                    console.log(`CA private key saved in: ${caKeyPath}`);
                });
            });

        }
    }
    __requestHandler (req, res, isHttps) {
        if (this.preInterceptor(req, res)) {

        } else {
            return this.__ignore(req, res, isHttps);
        }
    }
    __ignore(req, res, isHttps) {
        var urlObject = url.parse(req.url);
        var defaultPort = isHttps ? 443 : 80;
        var protocol = isHttps?'https:':'http:';
        var rOptions = {
            protocol: protocol,
            hostname: req.headers.host.split(':')[0],
            method: req.method,
            port: req.headers.host.split(':')[1] || defaultPort,
            path: urlObject.path,
            headers: req.headers
        }
        return this.__proxyRequest (rOptions, req, res, isHttps);
    }
    __connectHandler(req, cltSocket, head) {

        var srvUrl = url.parse(`https://${req.url}`);
        console.log(srvUrl);
        if (this.ssl && this.sslConnectInterceptor(req, cltSocket, head)) {
            this.fakeServersCenter.getServer(srvUrl.hostname, srvUrl.port , (serverObj) => {
                this.__proxyConnect(req, cltSocket, head, localIP, serverObj.port);
            });
        } else {
            this.__proxyConnect(req, cltSocket, head, srvUrl.hostname, srvUrl.port);
        }
    }
    __proxyConnect (req, cltSocket, head, hostname, port) {
        // tunneling https
        var proxySocket = net.connect(port, hostname, () => {
            cltSocket.write('HTTP/1.1 200 Connection Established\r\n' +
            '\r\n');
            proxySocket.write(head);
            proxySocket.pipe(cltSocket);
            cltSocket.pipe(proxySocket);
        });
        proxySocket.on('error', (e) => {
            console.log(hostname, port, e);
        });
        return proxySocket;
    }
    __proxyRequest (rOptions, req, res, isHttps) {
        var proxyReq = (isHttps ? https: http).request(rOptions, (proxyRes) => {
            Object.keys(proxyRes.headers).forEach(function(key) {
                if(proxyRes.headers[key] != undefined){
                    var newkey = key.replace(/^[a-z]|-[a-z]/g, (match) => {
                        return match.toUpperCase()
                    });
                    var newkey = key;
                    res.setHeader(newkey, proxyRes.headers[key]);
                }
            });
            res.writeHead(proxyRes.statusCode);
            proxyRes.pipe(res);
        });

        req.on('aborted', function () {
            proxyReq.abort();
        });
        req.pipe(proxyReq);
        return proxyReq;
    }

}
