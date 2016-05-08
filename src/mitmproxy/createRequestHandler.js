const http = require('http');
const https = require('https');
const url = require('url');


// create requestHandler function
module.exports = function createRequestHandler(requestInterceptor, responseInterceptor) {

    // return
    return function requestHandler(req, res, ssl) {
        var proxyReq;
        var urlObject = url.parse(req.url);
        var defaultPort = ssl ? 443 : 80;
        var protocol = ssl?'https:':'http:';
        var rOptions = {
            protocol: protocol,
            hostname: req.headers.host.split(':')[0],
            method: req.method,
            port: req.headers.host.split(':')[1] || defaultPort,
            path: urlObject.path,
            headers: req.headers
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
            } catch (e) {
                console.log(e);
            }
        })().then(
            (flag) => {
                if (flag) {
                    console.log(flag);
                }
            },
            (e) => {
                console.log(e);
            }
        );

    }

}
