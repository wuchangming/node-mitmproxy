var Mitmproxy = require('../lib');
var proxy = new Mitmproxy({
    isSSL: true,
    connectInterceptor: function() {return true;}
});
