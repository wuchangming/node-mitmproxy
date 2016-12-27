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

    var keys = pki.rsa.generateKeyPair(2046);
    var cert = pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = (new Date()).getTime() + '';
    cert.validity.notBefore = new Date();
    cert.validity.notBefore.setFullYear(cert.validity.notBefore.getFullYear() - 5);
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

utils.createFakeCertificateByDomain = function (caKey, caCert, domain) {
    var keys = pki.rsa.generateKeyPair(2046);
    var cert = pki.createCertificate();
    cert.publicKey = keys.publicKey;

    cert.serialNumber = (new Date()).getTime()+'';
    cert.validity.notBefore = new Date();
    cert.validity.notBefore.setFullYear(cert.validity.notBefore.getFullYear() - 1);
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);
    console.log(domain);
    var attrs = [{
      name: 'commonName',
      value: domain
    }, {
      name: 'countryName',
      value: 'CN'
    }, {
      shortName: 'ST',
      value: 'GuangDong'
    }, {
      name: 'localityName',
      value: 'ShengZhen'
    }, {
      name: 'organizationName',
      value: 'node-mitmproxy'
    }, {
      shortName: 'OU',
      value: 'https://github.com/wuchangming/node-mitmproxy'
    }];

    cert.setIssuer(caCert.subject.attributes);
    cert.setSubject(attrs);

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
        altNames: [{
          type: 2,
          value: domain
        }]
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

utils.createFakeCertificateByCA = function (caKey, caCert, originCertificate) {
    var certificate = utils.covertNodeCertToForgeCert(originCertificate);

    var keys = pki.rsa.generateKeyPair(2046);
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

// sync
utils.initCA =  function (basePath = config.getDefaultCABasePath()) {

    var caCertPath = path.resolve(basePath, config.caCertFileName);
    var caKeyPath = path.resolve(basePath, config.caKeyFileName);

    try {
        fs.accessSync(caCertPath, fs.F_OK);
        fs.accessSync(caKeyPath, fs.F_OK);

        // has exist
        return {
            caCertPath,
            caKeyPath,
            create: false
        }
    } catch (e) {

        var caObj = utils.createCA(config.caName);

        var caCert = caObj.cert;
        var cakey = caObj.key;

        var certPem = pki.certificateToPem(caCert);
        var keyPem = pki.privateKeyToPem(cakey);

        mkdirp.sync(path.dirname(caCertPath));
        fs.writeFileSync(caCertPath, certPem);
        fs.writeFileSync(caKeyPath, keyPem);

    }
    return {
        caCertPath,
        caKeyPath,
        create: true
    }
}
