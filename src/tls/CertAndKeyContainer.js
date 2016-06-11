const tlsUtils = require('./tlsUtils');

module.exports = class CertAndKeyContainer {
    constructor(maxLength = 1000) {
        this.queue = [];
        this.maxLength = maxLength;
    }
    addCert ({cert, key}) {
        if (this.queue.length >= this.maxLength) {
            this.queue.shift();
        }

        var mappingHostNames = tlsUtils.getMappingHostNamesFormCert(cert);

        var certObj = {
            mappingHostNames,
            cert,
            key
        }

        this.queue.push(certObj);

        return certObj;
    }
    getCert (hostname) {
        for (let i = 0; i < this.queue.length; i++) {
            let certObj = this.queue[i];
            let mappingHostNames = certObj.mappingHostNames;
            for (let j = 0; j < mappingHostNames.length; j++) {
                let DNSName = mappingHostNames[j];
                if (tlsUtils.isMappingHostName(DNSName, hostname)) {
                    this.reRankCert(i);
                    return certObj;
                }
            }
        }
        return null;
    }
    reRankCert (index) {
        // index ==> queue foot
        this.queue.push((this.queue.splice(index, 1))[0]);
    }
}
