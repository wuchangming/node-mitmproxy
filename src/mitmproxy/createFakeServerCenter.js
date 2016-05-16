const config = require('../common/config');
const fs = require('fs');
const path = require('path');
const forge = require('node-forge');
const FakeServersCenter = require('../tls/FakeServersCenter');

module.exports = function createFakeServerCenter({
    caBasePath,
    requestHandler,
    upgradeHandler
}) {
    var caCertPath = path.resolve(caBasePath, config.caCertFileName);
    var caKeyPath = path.resolve(caBasePath, config.caKeyFileName);
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
        console.log(colors.red(`无法读取CA根证书！确认是否已生成CA根证书, 并且已正确安装CA根证书`), e);
        process.exit(1);
    }

    return new FakeServersCenter({
        caCert,
        caKey,
        maxLength: 100,
        requestHandler,
        upgradeHandler
    });
}
