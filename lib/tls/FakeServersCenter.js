'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var https = require('https');
var tlsUtils = require('./tlsUtils');
var domain = require('domain');
var CertAndKeyContainer = require('./CertAndKeyContainer');
var forge = require('node-forge');

var pki = forge.pki;

var d = domain.create();
d.on('error', function (err) {
    console.log(err.message);
});

module.exports = function () {
    function FakeServersCenter(_ref) {
        var _ref$maxLength = _ref.maxLength;
        var maxLength = _ref$maxLength === undefined ? 50 : _ref$maxLength;
        var requestCB = _ref.requestCB;
        var errorCB = _ref.errorCB;
        var caCert = _ref.caCert;
        var caKey = _ref.caKey;

        _classCallCheck(this, FakeServersCenter);

        this.queue = [];
        this.maxLength = maxLength;
        this.requestCB = requestCB;
        this.errorCB = errorCB;
        this.caCert = caCert;
        this.caKey = caKey;
        this.certAndKeyContainer = new CertAndKeyContainer(1000);
    }

    _createClass(FakeServersCenter, [{
        key: 'addServer',
        value: function addServer(_ref2, callBack) {
            var _this = this;

            var cert = _ref2.cert;
            var key = _ref2.key;

            if (this.queue.length >= this.maxLength) {
                var delServerObj = this.queue.shift();
                delServerObj.server.close();
            }

            var mappingHostNames = tlsUtils.getMappingHostNamesFormCert(cert);

            var certPem = pki.certificateToPem(cert);
            var keyPem = pki.privateKeyToPem(key);

            var fakeServer = new https.Server({
                key: keyPem,
                cert: certPem
            });
            var serverObj = {
                mappingHostNames: mappingHostNames,
                cert: cert,
                key: key,
                server: fakeServer,
                port: 0 // if prot === 0 ,should listen server's `listening` event.
            };
            fakeServer.listen(0, function () {
                var address = fakeServer.address();
                serverObj.port = address.port;
            });
            fakeServer.on('request', function (req, res) {
                d.run(function () {
                    _this.requestCB(req, res);
                });
            });
            fakeServer.on('error', function (e) {
                d.run(function () {
                    _this.errorCB(e);
                });
            });
            fakeServer.on('listening', function () {
                callBack(serverObj);
            });
            this.queue.push(serverObj);
        }
    }, {
        key: 'getServer',
        value: function getServer(hostname, port, callBack) {
            var _this2 = this;

            var serverObj = null;
            var rServerObj = null;
            for (var i = 0; i < this.queue.length; i++) {
                serverObj = this.queue[i];
                var mappingHostNames = serverObj.mappingHostNames;
                for (var j = 0; j < mappingHostNames.length; j++) {
                    var DNSName = mappingHostNames[j];
                    if (tlsUtils.isMappingHostName(DNSName, hostname)) {
                        rServerObj = serverObj;
                        this.reRankServer(i);
                        callBack(serverObj);
                        return;
                    }
                }
            }
            if (!rServerObj) {
                var certObj = this.certAndKeyContainer.getCert();
                if (certObj) {
                    var serverObj = this.addServer({
                        cert: certObj.cert,
                        key: certObj.key
                    }, function (serverObj) {
                        callBack(serverObj);
                        return;
                    });
                } else {
                    var preReq = https.request({
                        port: port,
                        hostname: hostname,
                        path: '/',
                        method: 'GET'
                    }, function (preRes) {
                        var realCert = preRes.socket.getPeerCertificate();
                        var certObj = tlsUtils.createFakeCertificateByCA(_this2.caKey, _this2.caCert, realCert);
                        _this2.certAndKeyContainer.addCert(certObj);
                        preRes.socket.end();
                        preReq.end();
                        _this2.addServer(certObj, function (serverObj) {
                            callBack(serverObj);
                            return;
                        });
                    });
                    preReq.on('error', function (e) {
                        console.log(port, hostname, e);
                    });
                    preReq.end();
                }
            }
        }
    }, {
        key: 'reRankServer',
        value: function reRankServer(index) {
            // index ==> queue foot
            this.queue.push(this.queue.splice(index, 1)[0]);
        }
    }]);

    return FakeServersCenter;
}();