const url = require('url');

var util = exports;

util.getOptionsFormRequest = (req, ssl) => {
    var urlObject = url.parse(req.url);
    var defaultPort = ssl ? 443 : 80;
    var protocol = ssl ? 'https:' : 'http:';
    return {
        protocol: protocol,
        hostname: req.headers.host.split(':')[0],
        method: req.method,
        port: req.headers.host.split(':')[1] || defaultPort,
        path: urlObject.path,
        headers: req.headers,
        agent: false
    }
}
