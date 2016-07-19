const http = require('http');
const https = require('https');
const url = require('url');
const commonUtil = require('../common/util');
const upgradeHeader = /(^|,)\s*upgrade\s*($|,)/i;

// create requestHandler function
module.exports = function createRequestHandler(requestInterceptor, responseInterceptor, middlewares, externalProxy) {

    // return
    return function requestHandler(req, res, ssl) {

        var proxyReq;

        var rOptions = commonUtil.getOptionsFormRequest(req, ssl, externalProxy);

        if (rOptions.headers.connection === 'close') {
            req.socket.setKeepAlive(false);
        } else if (rOptions.customSocketId != null) {  // for NTLM
            req.socket.setKeepAlive(true, 60 * 60 * 1000);
        } else {
            req.socket.setKeepAlive(true, 30000);
        }

        var requestInterceptorPromise = () => {
            return new Promise((resolve, reject) => {
                var next = () => {
                    resolve();
                }
                try {
                    if (typeof requestInterceptor === 'function') {
                        requestInterceptor.call(null, rOptions, req, res, ssl, next);
                    } else {
                        resolve();
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }

        var proxyRequestPromise = () => {
            return new Promise((resolve, reject) => {

                rOptions.host = rOptions.hostname || rOptions.host || 'localhost';

                // use the binded socket for NTLM
                if (rOptions.agent && rOptions.customSocketId != null && rOptions.agent.getName) {
                    var socketName = rOptions.agent.getName(rOptions)
                    var bindingSocket = rOptions.agent.sockets[socketName]
                    if (bindingSocket && bindingSocket.length > 0) {
                        bindingSocket[0].once('free', onFree)
                        return;
                    }
                }
                onFree()
                function onFree() {
                    proxyReq = (rOptions.protocol == 'https:' ? https: http).request(rOptions, (proxyRes) => {
                        resolve(proxyRes);
                    });
                    proxyReq.on('timeout', () => {
                        reject(`${rOptions.host}:${rOptions.port}, request timeout`);
                    })

                    proxyReq.on('error', (e) => {
                        reject(e);
                    })

                    proxyReq.on('aborted', () => {
                        reject('server aborted reqest');
                        req.abort();
                    })

                    req.on('aborted', function () {
                        proxyReq.abort();
                    });
                    req.pipe(proxyReq);

                }

            });
        }

        // workflow control
        (async () => {

            await requestInterceptorPromise();

            if (res.finished) {
                return false;
            }

            var proxyRes = await proxyRequestPromise();


            var responseInterceptorPromise = new Promise((resolve, reject) => {
                var next = () => {
                    resolve();
                }
                try {
                    if (typeof responseInterceptor === 'function') {
                        responseInterceptor.call(null, req, res, proxyReq, proxyRes, ssl, next);
                    } else {
                        resolve();
                    }
                } catch (e) {
                    reject(e);
                }
            });

            await responseInterceptorPromise;

            if (res.finished) {
                return false;
            }

            try {
                if (!res.headersSent){  // prevent duplicate set headers
                    Object.keys(proxyRes.headers).forEach(function(key) {
                        if(proxyRes.headers[key] != undefined){
                            // https://github.com/nodejitsu/node-http-proxy/issues/362
                            if (/^www-authenticate$/i.test(key)) {
                                if (proxyRes.headers[key]) {
                                    proxyRes.headers[key] = proxyRes.headers[key] && proxyRes.headers[key].split(',');
                                }
                                key = 'www-authenticate';
                            }
                            res.setHeader(key, proxyRes.headers[key]);
                        }
                    });

                    res.writeHead(proxyRes.statusCode);
                    proxyRes.pipe(res);
                }
            } catch (e) {
                throw e;
            }
        })().then(
            (flag) => {
                // do nothing
            },
            (e) => {
                if (!res.finished) {
                    res.writeHead (500);
                    res.write(`Node-MitmProxy Warning:\n\n ${e.toString()}`);
                    res.end();
                }
                console.error(e);
            }
        );

    }

}
