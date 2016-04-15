var Mitmproxy = require('../lib');
var proxy = new Mitmproxy({
    ssl: true,
    sslConnectInterceptor: function() {return true;}
});
