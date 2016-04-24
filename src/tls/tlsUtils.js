const forge = require('node-forge');
const fs = require('fs');
const path = require('path');
const config = require('../common/config');
const _ = require('lodash');
const mkdirp = require('mkdirp');
const colors = require('colors');

var utils = exports;
var pki = forge.pki;

utils.createCA = function (CN) {

    var keys = pki.rsa.generateKeyPair(2048);
    var cert = pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = (new Date()).getTime() + '';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() - 5);
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 20);
    var attrs = [{
        name: 'commonName',
        value: CN
    }, {
        name: 'countryName',
        value: 'CN'
    }, {
        shortName: 'ST',
        value: 'GuangDong'
    }, {
        name: 'localityName',
        value: 'ShenZhen'
    }, {
        name: 'organizationName',
        value: 'node-mitmproxy'
    }, {
        shortName: 'OU',
        value: 'https://github.com/wuchangming/node-mitmproxy'
    }];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.setExtensions([{
        name: 'basicConstraints',
        critical: true,
        cA: true
    }, {
        name: 'keyUsage',
        critical: true,
        keyCertSign: true
    },{
        name: 'subjectKeyIdentifier'
    }]);

    // self-sign certificate
    cert.sign(keys.privateKey, forge.md.sha256.create());

    return {
        key: keys.privateKey,
        cert: cert
    }
}

utils.covertNodeCertToForgeCert = function (originCertificate) {
    var obj = forge.asn1.fromDer(originCertificate.raw.toString('binary'));
    return forge.pki.certificateFromAsn1(obj);
}

utils.createFakeCertificateByCA = function (caKey, caCert, originCertificate) {
    var certificate = utils.covertNodeCertToForgeCert(originCertificate);

    var keys = pki.rsa.generateKeyPair(2048);
    var cert = pki.createCertificate();
    cert.publicKey = keys.publicKey;

    cert.serialNumber = certificate.serialNumber;
    cert.validity.notBefore = new Date();
    cert.validity.notBefore.setFullYear(cert.validity.notBefore.getFullYear() - 1);
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);

    cert.setSubject(certificate.subject.attributes);
    cert.setIssuer(caCert.subject.attributes);

    certificate.subjectaltname && (cert.subjectaltname = certificate.subjectaltname);

    var subjectAltName = _.find(certificate.extensions, {name: 'subjectAltName'});
    cert.setExtensions([{
        name: 'basicConstraints',
        critical: true,
        cA: false
    },
    {
        name: 'keyUsage',
        critical: true,
        digitalSignature: true,
        contentCommitment: true,
        keyEncipherment: true,
        dataEncipherment: true,
        keyAgreement: true,
        keyCertSign: true,
        cRLSign: true,
        encipherOnly: true,
        decipherOnly: true
    },
    {
        name: 'subjectAltName',
        altNames: subjectAltName.altNames
    },
    {
        name: 'subjectKeyIdentifier'
    },
    {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        emailProtection: true,
        timeStamping: true
    },
    {
        name:'authorityKeyIdentifier'
    }]);
    cert.sign(caKey, forge.md.sha256.create());

    return {
        key: keys.privateKey,
        cert: cert
    };
}

utils.isBrowserRequest = function () {
    return /Mozilla/i.test(userAgent);
}
//
//  /^[^.]+\.a\.com$/.test('c.a.com')
//
utils.isMappingHostName = function (DNSName, hostname) {
    var reg = DNSName.replace(/\./g, '\\.').replace(/\*/g, '[^.]+');
    reg = '^' + reg + '$';
    return (new RegExp(reg)).test(hostname);
}

utils.getMappingHostNamesFormCert = function (cert) {
    var mappingHostNames = [];
    mappingHostNames.push(cert.subject.getField('CN') ? cert.subject.getField('CN').value : '');
    var altNames = cert.getExtension('subjectAltName') ? cert.getExtension('subjectAltName').altNames : [];
    mappingHostNames = mappingHostNames.concat(_.map(altNames, 'value'));
    return mappingHostNames;
}

utils.initCA =  function (basePath = config.getDefaultCABasePath()) {
    var caCertPath = path.resolve(basePath, config.caCertFileName);
    var caKeyPath = path.resolve(basePath, config.caKeyFileName);
    try {
        fs.accessSync(caCertPath, fs.F_OK);
        fs.accessSync(caKeyPath, fs.F_OK);
        var caCertPem = fs.readFileSync(caCertPath);
        var caKeyPem = fs.readFileSync(caKeyPath);
        this.caCert = forge.pki.certificateFromPem(caCertPem);
        this.caKey = forge.pki.privateKeyFromPem(caKeyPem);

        console.log(colors.cyan(`证书已经存在： ${basePath}`));
        // has exist
    } catch (e) {
        var caObj = utils.createCA(config.caName);
        this.caCert = caObj.cert;
        this.cakey = caObj.key;
        var certPem = pki.certificateToPem(this.caCert);

        var keyPem = pki.privateKeyToPem(this.cakey);

        mkdirp(path.dirname(caCertPath), function (err) {
            if (err) {
                console.error(err);
                return;
            }

            fs.writeFile(caCertPath, certPem, (err) => {
                if (err) throw err;
                console.log(colors.cyan(`CA Cert saved in: ${caCertPath}`));
            });

            fs.writeFile(caKeyPath, keyPem, (err) => {
                if (err) throw err;
                console.log(colors.cyan(`CA private key saved in: ${caKeyPath}`));
            });
        });

    }
}
