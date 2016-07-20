const url = require('url');
const Agent = require('./ProxyHttpAgent');
const HttpsAgent = require('./ProxyHttpsAgent');
const tunnelAgent = require('tunnel-agent');


var util = exports;
var httpsAgent = new HttpsAgent({
  keepAlive: true,
  timeout: 60000,
  keepAliveTimeout: 30000, // free socket keepalive for 30 seconds
  rejectUnauthorized: false
});
var httpAgent = new Agent({
  keepAlive: true,
  timeout: 60000,
  keepAliveTimeout: 30000 // free socket keepalive for 30 seconds
});
var socketId = 0;

var httpOverHttpAgent, httpsOverHttpAgent, httpOverHttpsAgent, httpsOverHttpsAgent;

util.getOptionsFormRequest = (req, ssl, externalProxy = null) => {
    var urlObject = url.parse(req.url);
    var defaultPort = ssl ? 443 : 80;
    var protocol = ssl ? 'https:' : 'http:';
    var headers = Object.assign({}, req.headers);

    delete headers['proxy-connection'];
    var agent = false;
    if (!externalProxy) {
        // keepAlive
        if (headers.connection !== 'close') {
            if (protocol == 'https:') {
                agent = httpsAgent;
            } else {
                agent = httpAgent;
            }
            headers.connection = 'keep-alive';
        }
    } else {
        agent = util.getTunnelAgent(protocol === 'https:', externalProxy);
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

    if (protocol === 'http:' && externalProxy && (url.parse(externalProxy)).protocol === 'http:') {
        var externalURL = url.parse(externalProxy)
        options.hostname = externalURL.hostname;
        options.port = externalURL.port;
        // support non-transparent proxy
        options.path = `http://${urlObject.host}${urlObject.path}`;
    }

    // mark a socketId for Agent to bind socket for NTLM
    if (req.socket.customSocketId) {
        options.customSocketId = req.socket.customSocketId;
    } else if (headers['authorization']) {
        options.customSocketId = req.socket.customSocketId = socketId++;
    }

    return options;

}

util.getTunnelAgent = (requestIsSSL, externalProxy) => {
    var urlObject = url.parse(externalProxy);
    var protocol = urlObject.protocol || 'http:';
    var port = urlObject.port;
    if (!port) {
        port = protocol === 'http:' ? 80 : 443;
    }
    var hostname = urlObject.hostname || 'localhost';

    if (requestIsSSL) {
        if (protocol === 'http:') {
            if (!httpsOverHttpAgent) {
                httpsOverHttpAgent = tunnelAgent.httpsOverHttp({
                    proxy: {
                        host: hostname,
                        port: port
                    }
                });
            }
            return httpsOverHttpAgent
        } else {
            if (!httpsOverHttpsAgent) {
                httpsOverHttpsAgent = tunnelAgent.httpsOverHttps({
                    proxy: {
                        host: hostname,
                        port: port
                    }
                });
            }
            return httpsOverHttpsAgent
        }
    } else {
        if (protocol === 'http:') {
            // if (!httpOverHttpAgent) {
            //     httpOverHttpAgent = tunnelAgent.httpOverHttp({
            //         proxy: {
            //             host: hostname,
            //             port: port
            //         }
            //     });
            // }
            return false
        } else {
            if (!httpOverHttpsAgent) {
                httpOverHttpsAgent = tunnelAgent.httpOverHttps({
                    proxy: {
                        host: hostname,
                        port: port
                    }
                });
            }
            return httpOverHttpsAgent
        }
    }
}
