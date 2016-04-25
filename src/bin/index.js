#!/usr/bin/env node
const MitmProxy = require('../mitmproxy/MitmProxy');
const program = require('commander');
const packageJson = require('../../package.json');
const tlsUtils = require('../tls/tlsUtils');

program
.version(packageJson.version)
.command('createCA')
.action(() => {
    try {
        tlsUtils.initCA();
    } catch (e) {
        console.log(e);
    } finally {

    }
});

program
.command('start')
.action(() => {
    try {
        var proxy = new MitmProxy({
            ssl: true,
            sslConnectInterceptor: function() {return true;}
        });
    } catch (e) {
        console.log(e);
    } finally {

    }
});

program.parse(process.argv);
