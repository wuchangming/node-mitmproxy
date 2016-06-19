const url = require('url');
const Agent = require('agentkeepalive');
const HttpsAgent = require('agentkeepalive').HttpsAgent;

var util = exports;
var httpAgent =  new Agent();
var httpsAgent = new HttpsAgent();

util.getOptionsFormRequest = (req, ssl) => {
    var urlObject = url.parse(req.url);
    var defaultPort = ssl ? 443 : 80;
    var protocol = ssl ? 'https:' : 'http:';
    var headers = Object.assign({}, req.headers);

    delete headers['proxy-connection'];
    // keepAlive
    var agent = false;
    if (headers.connection === 'keep-alive') {
        if (protocol == 'https:') {
            agent = httpsAgent;
        } else {
            agent = httpAgent;
        }
    }
    return {
        protocol: protocol,
        hostname: req.headers.host.split(':')[0],
        method: req.method,
        port: req.headers.host.split(':')[1] || defaultPort,
        path: urlObject.path,
        headers: req.headers,
        agent: agent
    }
}
