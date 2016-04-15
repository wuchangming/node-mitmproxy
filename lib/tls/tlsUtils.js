'use strict';

var forge = require('node-forge');
var fs = require('fs');
var path = require('path');
var config = require('../common/config');
var _ = require('lodash');

var utils = exports;
var pki = forge.pki;

utils.createCA = function (CN) {

    var keys = pki.rsa.generateKeyPair(2048);
    var cert = pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = new Date().getTime() + '';
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
    }, {
        name: 'subjectKeyIdentifier'
    }]);

    // self-sign certificate
    cert.sign(keys.privateKey, forge.md.sha256.create());

    return {
        key: keys.privateKey,
        cert: cert
    };
};

utils.covertNodeCertToForgeCert = function (originCertificate) {
    var obj = forge.asn1.fromDer(originCertificate.raw.toString('binary'));
    return forge.pki.certificateFromAsn1(obj);
};

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

    var subjectAltName = _.find(certificate.extensions, { name: 'subjectAltName' });
    cert.setExtensions([{
        name: 'basicConstraints',
        critical: true,
        cA: false
    }, {
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
    }, {
        name: 'subjectAltName',
        altNames: subjectAltName.altNames
    }, {
        name: 'subjectKeyIdentifier'
    }, {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        emailProtection: true,
        timeStamping: true
    }, {
        name: 'authorityKeyIdentifier'
    }]);
    cert.sign(caKey, forge.md.sha256.create());

    return {
        key: keys.privateKey,
        cert: cert
    };
};

utils.isBrowserRequest = function () {
    return (/Mozilla/i.test(userAgent)
    );
};
//
//  /^[^.]+\.a\.com$/.test('c.a.com')
//
utils.isMappingHostName = function (DNSName, hostname) {
    var reg = DNSName.replace(/\./g, '\\.').replace(/\*/g, '[^.]+');
    reg = '^' + reg + '$';
    return new RegExp(reg).test(hostname);
};

utils.getMappingHostNamesFormCert = function (cert) {
    var mappingHostNames = [];
    mappingHostNames.push(cert.subject.getField('CN') ? cert.subject.getField('CN').value : '');
    var altNames = cert.getExtension('subjectAltName') ? cert.getExtension('subjectAltName').altNames : [];
    mappingHostNames = mappingHostNames.concat(_.map(altNames, 'value'));
    return mappingHostNames;
};