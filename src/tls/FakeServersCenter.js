const https = require('https');
const tlsUtils = require('./tlsUtils');
const CertAndKeyContainer = require('./CertAndKeyContainer');
const forge = require('node-forge');
const pki = forge.pki;
const colors = require('colors');

module.exports = class FakeServersCenter {
    constructor({maxLength = 50, requestHandler, caCert, caKey}) {
        this.queue = [];
        this.maxLength = maxLength;
        this.requestHandler = requestHandler;
        this.caCert = caCert;
        this.caKey = caKey;
        this.certAndKeyContainer = new CertAndKeyContainer(1000);
    }
    addServer ({cert, key}, callBack) {
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
            mappingHostNames,
            cert,
            key,
            server: fakeServer,
            port: 0  // if prot === 0 ,should listen server's `listening` event.
        }
        fakeServer.listen(0, () => {
            var address = fakeServer.address();
            serverObj.port = address.port;
        });
        fakeServer.on('request', (req, res) => {
            var ssl = true;
            this.requestHandler(req, res, ssl);
        });
        fakeServer.on('error', (e) => {
            console.error(e);
        });
        fakeServer.on('listening', ()=>{
            callBack(serverObj);
        });
        // TODO:
        fakeServer.on('upgrade', function(req, socket, head) {
            socket.write('HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
            'Upgrade: WebSocket\r\n' +
            'Connection: Upgrade\r\n' +
            '\r\n');
            console.log(colors.yellow('暂未支持代理WebSocket！'));
            socket.pipe(socket);
        });
        this.queue.push(serverObj);

    }
    getServer (hostname, port, callBack) {
        var serverObj = null;
        var rServerObj = null;
        for (let i = 0; i < this.queue.length; i++) {
            serverObj = this.queue[i];
            let mappingHostNames = serverObj.mappingHostNames;
            for (let j = 0; j < mappingHostNames.length; j++) {
                let DNSName = mappingHostNames[j];
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
                }, (serverObj) => {
                    callBack(serverObj);
                    return;
                });
            } else {

                var certObj;
                var preReq = https.request({
                    port: port,
                    hostname: hostname,
                    path: '/',
                    method: 'HEAD'
                }, (preRes) => {
                    try {
                        var realCert  = preRes.socket.getPeerCertificate();
                        if (realCert) {
                            certObj = tlsUtils.createFakeCertificateByCA(this.caKey, this.caCert, realCert);
                        } else {
                            certObj = tlsUtils.createFakeCertificateByDomain(this.caKey, this.caCert, hostname);
                        }
                        this.certAndKeyContainer.addCert(certObj);
                        preRes.socket.end();
                        preReq.end();
                        this.addServer(certObj, (serverObj) => {
                            callBack(serverObj);
                            return;
                        });
                    } catch (e) {
                        console.log(e);
                    }
                });
                preReq.on('socket', function (socket) {
                    socket.setTimeout(10*1000);
                    socket.on('timeout', function() {
                        preReq.abort();
                    });
                });
                preReq.on('error', (e) => {
                    console.log(port, hostname, e);
                    if (!certObj) {
                        certObj = tlsUtils.createFakeCertificateByDomain(this.caKey, this.caCert, hostname);
                        this.certAndKeyContainer.addCert(certObj);
                        this.addServer(certObj, (serverObj) => {
                            callBack(serverObj);
                            return;
                        });
                    }
                })
                preReq.end();
            }
        }
    }
    reRankServer (index) {
        // index ==> queue foot
        this.queue.push((this.queue.splice(index, 1))[0]);
    }

}
