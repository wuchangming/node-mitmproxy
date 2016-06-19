const http = require('http');
const https = require('https');
const url = require('url');
const commonUtil = require('../common/util');
const upgradeHeader = /(^|,)\s*upgrade\s*($|,)/i;

// create requestHandler function
module.exports = function createRequestHandler(requestInterceptor, responseInterceptor, plugins) {

    // return
    return function requestHandler(req, res, ssl) {

        var proxyReq;

        var rOptions = commonUtil.getOptionsFormRequest(req, ssl);

        if (typeof rOptions.headers.connection === 'string' && rOptions.headers.connection === 'close') {
            req.socket.setKeepAlive(false);
            console.log('req.socket.setKeepAlive(false);');
        }

        var requestInterceptorPromise = new Promise((resolve, reject) => {
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

        var proxyRequestPromise = new Promise((resolve, reject) => {

            proxyReq = (rOptions.protocol == 'https:' ? https: http).request(rOptions, (proxyRes) => {
                resolve(proxyRes);
            });

            proxyReq.on('error', (e) => {
                console.log(e);
            })

            req.on('aborted', function () {
                proxyReq.abort();
            });
            req.pipe(proxyReq);
        });

        // workflow control
        (async () => {

            await requestInterceptorPromise;

            if (res.finished) {
                return false;
            }

            var proxyRes = await proxyRequestPromise;


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
                            // var key = key.replace(/^[a-z]|-[a-z]/g, (match) => {
                            //     return match.toUpperCase()
                            // });
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
                console.error(e);
            }
        })().then(
            (flag) => {
                // do nothing
            },
            (e) => {
                console.error(e.stack);
            }
        );

    }

}
