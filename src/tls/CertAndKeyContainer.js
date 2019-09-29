const tlsUtils = require('./tlsUtils');
const https = require('https');

module.exports = class CertAndKeyContainer {
    constructor({
        maxLength = 1000,
        getCertSocketTimeout = 2 * 1000,
        caCert,
        caKey
    }) {
        this.queue = [];
        this.maxLength = maxLength;
        this.getCertSocketTimeout = getCertSocketTimeout;
        this.caCert = caCert;
        this.caKey = caKey;
    }
    addCertPromise (certPromiseObj) {
        if (this.queue.length >= this.maxLength) {
            this.queue.shift();
        }
        this.queue.push(certPromiseObj);
        return certPromiseObj;
    }
    getCertPromise (hostname, port) {
        for (let i = 0; i < this.queue.length; i++) {
            let _certPromiseObj = this.queue[i];
            let mappingHostNames = _certPromiseObj.mappingHostNames;
            for (let j = 0; j < mappingHostNames.length; j++) {
                let DNSName = mappingHostNames[j];
                if (tlsUtils.isMappingHostName(DNSName, hostname)) {
                    this.reRankCert(i);
                    return _certPromiseObj.promise;
                }
            }
        }

        var certPromiseObj = {
            mappingHostNames: [hostname] // temporary hostname
        }

        let promise = new Promise((resolve, reject) => {
            var once = true;
            var _resolve = (_certObj) => {
                if (once) {
                    once = false;
                    var mappingHostNames = tlsUtils.getMappingHostNamesFormCert(_certObj.cert);
                    certPromiseObj.mappingHostNames = mappingHostNames; // change
                    resolve(_certObj);
                }
            }
            let certObj;
            var preReq = https.request({
                port: port,
                hostname: hostname,
                path: '/',
                method: 'HEAD'
            }, (preRes) => {
                try {
                    var realCert  = preRes.socket.getPeerCertificate();
                    if (realCert) {
                        try {
                            certObj = tlsUtils.createFakeCertificateByCA(this.caKey, this.caCert, realCert);
                        } catch (error) {
                            certObj = tlsUtils.createFakeCertificateByDomain(this.caKey, this.caCert, hostname);
                        }
                    } else {
                        certObj = tlsUtils.createFakeCertificateByDomain(this.caKey, this.caCert, hostname);
                    }
                    _resolve(certObj);
                } catch (e) {
                    reject(e);
                }
            });
            preReq.setTimeout(~~this.getCertSocketTimeout, () => {
                if (!certObj) {
                    certObj = tlsUtils.createFakeCertificateByDomain(this.caKey, this.caCert, hostname);
                    _resolve(certObj);
                }
            });
            preReq.on('error', (e) => {
                if (!certObj) {
                    certObj = tlsUtils.createFakeCertificateByDomain(this.caKey, this.caCert, hostname);
                    _resolve(certObj);
                }
            })
            preReq.end();
        });

        certPromiseObj.promise = promise;

        return (this.addCertPromise(certPromiseObj)).promise;

    }
    reRankCert (index) {
        // index ==> queue foot
        this.queue.push((this.queue.splice(index, 1))[0]);
    }
}
