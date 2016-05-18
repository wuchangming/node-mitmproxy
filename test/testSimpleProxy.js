// MitmProxy转发时信任任何证书
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'
var mitmproxy = require('../lib');
mitmproxy.createProxy({
    sslConnectInterceptor: (req, cltSocket, head) => true,
    requestInterceptor: (rOptions, req, res, ssl, next) => {
        if (rOptions.hostname === 'p39-keyvalueservice.icloud.com') {
            next();
            return;
        }
        next();
    },
    getCertSocketTimeout: 10 * 1000
});
