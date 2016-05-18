const config = require('../common/config');
const fs = require('fs');
const path = require('path');
const forge = require('node-forge');
const FakeServersCenter = require('../tls/FakeServersCenter');
const colors = require('colors');

module.exports = function createFakeServerCenter({
    caCertPath,
    caKeyPath,
    requestHandler,
    upgradeHandler,
    getCertSocketTimeout
}) {
    var caCert;
    var caKey;
    try {
        fs.accessSync(caCertPath, fs.F_OK);
        fs.accessSync(caKeyPath, fs.F_OK);
        var caCertPem = fs.readFileSync(caCertPath);
        var caKeyPem = fs.readFileSync(caKeyPath);
        caCert = forge.pki.certificateFromPem(caCertPem);
        caKey = forge.pki.privateKeyFromPem(caKeyPem);
    } catch (e) {
        console.log(colors.red(`Can not find \`CA certificate\` or \`CA key\`.`), e);
        process.exit(1);
    }

    return new FakeServersCenter({
        caCert,
        caKey,
        maxLength: 100,
        requestHandler,
        upgradeHandler,
        getCertSocketTimeout
    });
}
