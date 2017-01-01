const fs = require('fs');
const url = require('url');

module.exports = {
    sslConnectInterceptor: (req, cltSocket, head) => true,
    requestInterceptor: (rOptions, req, res, ssl, next) => {
        console.log(`正在访问：${rOptions.protocol}//${rOptions.hostname}:${rOptions.port}`);
        // console.log('cookie:', rOptions.headers.cookie);
        // res.end('hello node-mitmproxy!');
        next();
    },
    responseInterceptor: (req, res, proxyReq, proxyRes, ssl, next) => {
        next();
    },
    externalProxy: (req, ssl) => {
        var headers = req.headers;
        console.log(headers);
        if (headers['upgrade'] && headers['upgrade'] === 'mmtls') {
            return ''
        } else {
            return 'http://127.0.0.1:8888'
        }
    }
}
