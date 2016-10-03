# node-mitmproxy
`node-mitmproxy` is an extensible [man-in-the-middle](https://en.wikipedia.org/wiki/Man-in-the-middle_attack) proxy for HTTP/HTTPS base on Node.js.

[![npm](https://img.shields.io/npm/dt/node-mitmproxy.svg)](https://www.npmjs.com/package/node-mitmproxy)
[![Build Status](https://travis-ci.org/wuchangming/node-mitmproxy.svg?branch=4.x)](https://travis-ci.org/wuchangming/node-mitmproxy)
[![Coverage Status](https://coveralls.io/repos/github/wuchangming/node-mitmproxy/badge.svg?branch=4.x)](https://coveralls.io/github/wuchangming/node-mitmproxy?branch=4.x)  
## Features
* Support HTTP and HTTPS
* Configurable and integratable
* Powerful build-in plugins provided

## API

createProxy([options])
----------
`createProxy` create a mitmproxy instance.

```
const mitmproxy = require('node-mitmproxy')
let proxy = mitmproxy.createProxy()
```
options:
----------
*   port
*   ssl
*   sslConnectInterceptor
*   requestInterceptor
*   responseInterceptor
*   middlewares
*   externalProxy
*   caKeyPath
*   caCertPath
*   silence

options.port
-----------
```
default: 6789
```
options.ssl
-----------
```
default: false  
```
Intercept HTTPS

options.sslConnectInterceptor
-----------
effective when `ssl:true`, should intercept the HTTPS request.

```
options.sslConnectInterceptor = function (clientReq, clientSocket, head) {

    let isBrowserRequest = /Mozilla/.test(req.headers['user-agent']);

    // Only intercept browser's HTTPS Request
    if (isBrowserRequest) {
        return true;
    } else {
        return false;
    }
}
```

options.requestInterceptor
-----------
Request interceptor
```
options.requestInterceptor = function (clientReq, clientSocket, head) {

    let isBrowserRequest = /Mozilla/.test(req.headers['user-agent']);

    // Only intercept browser's HTTPS Request
    if (isBrowserRequest) {
        return true;
    } else {
        return false;
    }
}
```


options.responseInterceptor
-----------


options.middlewares
-----------
`middleware` is a Object has one or more `interceptor`'s combo.

options.externalProxy
-----------
set an external proxy
```
    options.externalProxy = 'http://127.0.0.1:8888';
```

options.caKeyPath
-----------
```
default: %HOMEPATH%/.node-mitmproxy/node-mitmproxy.ca.key.pem
```

options.caCertPath
-----------
```
default: %HOMEPATH%/.node-mitmproxy/node-mitmproxy.ca.crt
```

options.createFakeCertBaseOnOrigin
-----------

options.silence
-----------
```
default: false
```
set terminal log
options.mapLocalList
-----------
request map to local files
options.outputCertFiles
-----------
```
default: false
```
output certs

options.outputCertFilesPath
-----------
effective when outputCertFiles is `true`
```
default: %HOMEPATH%/.node-mitmproxy/certs
```

## middleware
How to create?
-----------
