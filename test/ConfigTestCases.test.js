// set babel in entry file
require("babel-polyfill");
// require('babel-register')({
//     presets: ["es2015"],
//     plugins: ["transform-async-to-generator"]
// });
var mitmproxy = require('../lib/mitmproxy');

mitmproxy.createProxy({
    sslConnectInterceptor: () => true
});
