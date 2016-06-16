const http = require('http');
const https = require('https');
const url = require('url');
const commonUtil = require('../common/util');
const upgradeHeader = /(^|,)\s*upgrade\s*($|,)/i;
const Agent = require('agentkeepalive');
const HttpsAgent = require('agentkeepalive').HttpsAgent;


var agent =  new Agent();
var httpsAgent = new HttpsAgent();

// create requestHandler function
module.exports = function createRequestHandler(requestInterceptor, responseInterceptor, plugins) {

    // return
    return function requestHandler(req, res, ssl) {
        var proxyReq;

        var rOptions = commonUtil.getOptionsFormRequest(req, ssl);

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

            // keepAlive
            if (rOptions.headers.connection === 'keep-alive') {
                if (rOptions.protocol == 'https:') {
                    rOptions.agent = httpsAgent;
                } else {
                    rOptions.agent = agent;
                }
            }
            // copy from node-http-proxy :)
            // Remark: If we are false and not upgrading, set the connection: close. This is the right thing to do
            // as node core doesn't handle this COMPLETELY properly yet.
            //
            if (!rOptions.agent) {
                rOptions.headers = rOptions.headers || {};
                if (typeof rOptions.headers.connection !== 'string' || !upgradeHeader.test(rOptions.headers.connection)) {
                    rOptions.headers.connection = 'close';
                }
            }

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
                // prevent duplicate set headers
                if (!res.headersSent){
                    Object.keys(proxyRes.headers).forEach(function(key) {
                        if(proxyRes.headers[key] != undefined){
                            var newkey = key.replace(/^[a-z]|-[a-z]/g, (match) => {
                                return match.toUpperCase()
                            });
                            var newkey = key;
                            res.setHeader(newkey, proxyRes.headers[key]);
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
