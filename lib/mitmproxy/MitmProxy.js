'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var tlsUtils = require('../tls/tlsUtils');
var http = require('http');
var path = require('path');
var https = require('https');
var net = require('net');
var url = require('url');
var forge = require('node-forge');
var config = require('../common/config');
var FakeServersCenter = require('../tls/FakeServersCenter');
var domain = require('domain');
var fs = require('fs');
var mkdirp = require('mkdirp');

var pki = forge.pki;
var logColor = config.logColor;

var localIP = '127.0.0.1';

var d = domain.create();
d.on('error', function (err) {
    console.log(err.message);
});

var nope = function nope() {};

module.exports = function () {
    function MitmProxy(_ref) {
        var _this = this;

        var _ref$port = _ref.port;
        var port = _ref$port === undefined ? 6789 : _ref$port;
        var _ref$CAPath = _ref.CAPath;
        var CAPath = _ref$CAPath === undefined ? config.getDefaultCABasePath() : _ref$CAPath;
        var _ref$ssl = _ref.ssl;
        var ssl = _ref$ssl === undefined ? false : _ref$ssl;
        var _ref$preInterceptor = _ref.preInterceptor;
        var preInterceptor = _ref$preInterceptor === undefined ? nope : _ref$preInterceptor;
        var _ref$postInterceptor = _ref.postInterceptor;
        var postInterceptor = _ref$postInterceptor === undefined ? nope : _ref$postInterceptor;
        var _ref$connectIntercept = _ref.connectInterceptor;
        var connectInterceptor = _ref$connectIntercept === undefined ? nope : _ref$connectIntercept;
        var caBasePath = _ref.caBasePath;

        _classCallCheck(this, MitmProxy);

        this.preInterceptor = preInterceptor;
        this.postInterceptor = postInterceptor;
        this.connectInterceptor = connectInterceptor;
        this.ssl = ssl;

        // if (ssl) {
        this.__initCA(caBasePath);
        // }

        if (this.ssl) {
            this.fakeServersCenter = new FakeServersCenter({
                caCert: this.caCert,
                caKey: this.caKey,
                maxLength: 100,
                requestCB: function requestCB(req, res) {
                    _this.__requestHandler(req, res, true);
                },
                errorCB: nope
            });
        }

        var server = new http.Server();
        server.listen(port, function () {
            console.log(logColor.FgGreen + '%s' + logColor.Reset, 'node-mitmproxy启动端口: ' + port);
            server.on('error', function (e) {
                console.error(e);
            });
            server.on('request', function (req, res) {
                d.run(function () {
                    var isHttps = false;
                    var proxyRequest = _this.__requestHandler(req, res, isHttps);
                });
            });
            // tunneling for https
            server.on('connect', function (req, cltSocket, head) {
                d.run(function () {
                    var proxySocket = _this.__connectHandler(req, cltSocket, head);
                });
            });
        });
    }

    _createClass(MitmProxy, [{
        key: '__initCA',
        value: function __initCA() {
            var basePath = arguments.length <= 0 || arguments[0] === undefined ? config.getDefaultCABasePath() : arguments[0];

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

                    fs.writeFile(caCertPath, certPem, function (err) {
                        if (err) throw err;
                        console.log('CA Cert saved in: ' + caCertPath);
                    });

                    fs.writeFile(caKeyPath, keyPem, function (err) {
                        if (err) throw err;
                        console.log('CA private key saved in: ' + caKeyPath);
                    });
                });
            }
        }
    }, {
        key: '__requestHandler',
        value: function __requestHandler(req, res, isHttps) {
            if (this.preInterceptor(req, res)) {} else {
                return this.__ignore(req, res, isHttps);
            }
        }
    }, {
        key: '__ignore',
        value: function __ignore(req, res, isHttps) {
            var urlObject = url.parse(req.url);
            var defaultPort = isHttps ? 443 : 80;
            var protocol = isHttps ? 'https:' : 'http:';
            var rOptions = {
                protocol: protocol,
                hostname: req.headers.host.split(':')[0],
                method: req.method,
                port: req.headers.host.split(':')[1] || defaultPort,
                path: urlObject.path,
                headers: req.headers
            };
            return this.__proxyRequest(rOptions, req, res, isHttps);
        }
    }, {
        key: '__connectHandler',
        value: function __connectHandler(req, cltSocket, head) {
            var _this2 = this;

            var srvUrl = url.parse('https://' + req.url);
            console.log(srvUrl);
            if (this.ssl && this.connectInterceptor(req, cltSocket, head)) {
                this.fakeServersCenter.getServer(srvUrl.hostname, srvUrl.port, function (serverObj) {
                    _this2.__proxyConnect(req, cltSocket, head, localIP, serverObj.port);
                });
            } else {
                this.__proxyConnect(req, cltSocket, head, srvUrl.hostname, srvUrl.port);
            }
        }
    }, {
        key: '__proxyConnect',
        value: function __proxyConnect(req, cltSocket, head, hostname, port) {
            // tunneling https
            var proxySocket = net.connect(port, hostname, function () {
                cltSocket.write('HTTP/1.1 200 Connection Established\r\n' + '\r\n');
                proxySocket.write(head);
                proxySocket.pipe(cltSocket);
                cltSocket.pipe(proxySocket);
            });
            proxySocket.on('error', function (e) {
                console.log(hostname, port, e);
            });
            return proxySocket;
        }
    }, {
        key: '__proxyRequest',
        value: function __proxyRequest(rOptions, req, res, isHttps) {
            var proxyReq = (isHttps ? https : http).request(rOptions, function (proxyRes) {
                Object.keys(proxyRes.headers).forEach(function (key) {
                    if (proxyRes.headers[key] != undefined) {
                        var newkey = key.replace(/^[a-z]|-[a-z]/g, function (match) {
                            return match.toUpperCase();
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
    }]);

    return MitmProxy;
}();