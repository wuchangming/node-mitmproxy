const https = require('https');
const tlsUtils = require('./tlsUtils');
const domain = require('domain');
const CertAndKeyContainer = require('./CertAndKeyContainer');
const forge = require('node-forge');

var pki = forge.pki;

var d = domain.create();
d.on('error', function (err) {
    console.log(err.message);
});

module.exports = class FakeServersCenter {
    constructor({maxLength = 50, requestCB, errorCB, caCert, caKey}) {
        this.queue = [];
        this.maxLength = maxLength;
        this.requestCB = requestCB;
        this.errorCB = errorCB;
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
            d.run(() => {
                this.requestCB(req, res);
            });
        });
        fakeServer.on('error', (e) => {
            d.run(() => {
                this.errorCB(e);
            });
        });
        fakeServer.on('listening', ()=>{
            callBack(serverObj);
        });
        this.queue.push(serverObj);

    }
    getServer (hostname, port, callBack) {
        var serverObj = null;
        for (let i = 0; i < this.queue; i++) {
            serverObj = this.queue[i];
            let mappingHostNames = serverObj.mappingHostNames;
            for (let j = 0; j < mappingHostNames.length; j++) {
                let DNSName = mappingHostNames[j];
                if (tlsUtils.isMappingHostName(DNSName, hostname)) {
                    this.reRankServer(i);
                    callBack(serverObj);
                    return;
                }
            }
        }
        if (!serverObj) {
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
                var preReq = https.request({
                    port: port,
                    hostname: hostname,
                    path: '/',
                    method: 'GET'
                }, (preRes) => {
                    var realCert  = preRes.socket.getPeerCertificate();
                    var certObj = tlsUtils.createFakeCertificateByCA(this.caKey, this.caCert, realCert);
                    this.certAndKeyContainer.addCert(certObj);
                    preRes.socket.end();
                    preReq.end();
                    this.addServer(certObj, (serverObj) => {
                        // console.log(serverObj);
                        callBack(serverObj);
                        return;
                    });
                });
                preReq.on('error', (e) => {
                    console.log(e);
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
