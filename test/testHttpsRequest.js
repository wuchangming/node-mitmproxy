const https = require('https');
var preReq = https.request({
    port: 443,
    hostname: 'github.com',
    path: '/',
    method: 'HEAD'
}, (preRes) => {
    console.log(preRes.socket.getPeerCertificate());
});
preReq.end();
