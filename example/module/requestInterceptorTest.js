// set babel in entry file
// require('babel-register')({
//     presets: ["es2015"],
//     plugins: ["transform-async-to-generator"]
// });
var mitmproxy = require('../../lib');

mitmproxy.createProxy({
    sslConnectInterceptor: (req, cltSocket, head) => true,
    requestInterceptor: (rOptions, req, res, ssl, next) => {
        console.log(`正在访问：${rOptions.protocol}//${rOptions.hostname}:${rOptions.port}`);
        console.log('cookie:', rOptions.headers.cookie);
        res.end('hello node-mitmproxy!');
        next();
    }
});
