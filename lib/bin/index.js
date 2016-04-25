#!/usr/bin/env node
'use strict';

var MitmProxy = require('../mitmproxy/MitmProxy');
var program = require('commander');
var packageJson = require('../../package.json');
var tlsUtils = require('../tls/tlsUtils');

program.version(packageJson.version).command('createCA').action(function () {
    try {
        tlsUtils.initCA();
    } catch (e) {
        console.log(e);
    } finally {}
});

program.command('start').action(function () {
    try {
        var proxy = new MitmProxy({
            ssl: true,
            sslConnectInterceptor: function sslConnectInterceptor() {
                return true;
            }
        });
    } catch (e) {
        console.log(e);
    } finally {}
});

program.parse(process.argv);