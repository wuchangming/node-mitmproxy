'use strict'

const createConnectHandler = require('../../lib/mitmproxy/createConnectHandler');
const net = require('net');
const https = require('https');
const http = require('http');
const LOCAL_IP = require('../../src/config').LOCAL_IP;
const fs = require('fs');
const path = require('path');

let connectProxy = {};
let httpsServerPool = {};

function createHttpsServerPromise() {
    return new Promise(resolve => {
        let server = http.Server();
        server.listen(() => {
            let address = server.address();
            let port = address.port;
            httpsServerPool[port] = server;
            resolve(address.port);
        })
        server.on('request', (req, res) => {
            console.log('ccc');
            server.connected = true;
        })
    });
}

function createProxyServerPromise(connectHandler) {
    return new Promise(resolve => {
        let server = http.Server();
        server.on('connect', (req, cltSocket, head) => {
            connectHandler(req, cltSocket, head);
        });
        server.listen(() => {
            let address = server.address();
            let port = address.port;
            connectProxy[port] = server;
            resolve(address.port);
        });
    });
}

function mockCreateFakeServerPromise(port) {
    return () => new Promise((resolve, reject) => {
        resolve({
            port
        });
    });
}

describe('createConnectHandler', () => {

    beforeAll(() => {
        /**
         * create two server to mock connect, push into `serverPorts` array.
         * The first one  : mock real server.
         * The second one : mock fake server.
         */
        return new Promise(resolve => {
            Promise.all([createHttpsServerPromise(), createHttpsServerPromise()]).then(ports => {
                console.log(ports);
                resolve()
            })
        })
    })

    it('should not intercept HTTPS, when ssl:false', (done) => {

        let ssl = false;
        let sslConnectInterceptor = () => true;
        let middlewares = [];
        let serverPorts = Object.keys(httpsServerPool);

        let createFakeServerPromise = mockCreateFakeServerPromise(serverPorts[0]);
        let conncetHandler = createConnectHandler(ssl, sslConnectInterceptor, middlewares, createFakeServerPromise);

        createProxyServerPromise(conncetHandler).then((port) => {
            console.log(port);
            var options = {
                port,
                hostname: LOCAL_IP,
                method: 'CONNECT',
                path: `https://${LOCAL_IP}:${serverPorts[0]}`,
                headers: {
                    'User-Agent': 'test'
                }
            };

            var req = http.request(options);
            req.end();
            req.on('connect', (res, socket, head) => {
                console.log('got connected!');
                socket.write('GET / HTTP/1.1\r\n' +
                    '\r\n');
                socket.end();
            })
            req.on('error', (e) => {
                console.error(e);
            })
        });

    })

    afterAll(() => {
        // let closePromiseArr = (() => {
        //     let arr = [];
        //     if (httpsServerPool.length > 0) {
        //         for (var i = 0; i < httpsServerPool.length; i++) {
        //             let server = httpsServerPool[i];
        //             let p = new Promise(r => {
        //                 server.close(() => {
        //                     r();
        //                 });
        //             });
        //             arr.push(p);
        //         }
        //     }
        // })();
        //
        // return new Promise(resolve => {
        //     Promise.all(closePromiseArr).then(() => {
        //         resolve();
        //     });
        // })

    })

})
