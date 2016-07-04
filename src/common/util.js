const url = require('url');
const Agent = require('./ProxyHttpAgent');
const HttpsAgent = require('./ProxyHttpsAgent');

var util = exports;
var httpsAgent = new HttpsAgent({
  keepAlive: true,
  timeout: 60000,
  keepAliveTimeout: 30000 // free socket keepalive for 30 seconds
});
var httpAgent = new Agent({
  keepAlive: true,
  timeout: 60000,
  keepAliveTimeout: 30000 // free socket keepalive for 30 seconds
});
var socketId = 0;

util.getOptionsFormRequest = (req, ssl) => {
    var urlObject = url.parse(req.url);
    var defaultPort = ssl ? 443 : 80;
    var protocol = ssl ? 'https:' : 'http:';
    var headers = Object.assign({}, req.headers);

    delete headers['proxy-connection'];
    // keepAlive
    var agent = false;
    if (headers.connection !== 'close') {
        if (protocol == 'https:') {
            agent = httpsAgent;
        } else {
            agent = httpAgent;
        }
        headers.connection = 'keep-alive';
    }

    var options =  {
        protocol: protocol,
        hostname: req.headers.host.split(':')[0],
        method: req.method,
        port: req.headers.host.split(':')[1] || defaultPort,
        path: urlObject.path,
        headers: req.headers,
        agent: agent
    }

    // mark a socketId for Agent to bind socket for NTLM
    if (req.socket.customSocketId) {
        options.customSocketId = req.socket.customSocketId;
    } else if (headers['authorization']) {
        options.customSocketId = req.socket.customSocketId = socketId++;
    }

    return options;

}
