var Mitmproxy = require('../lib');
var proxy = new Mitmproxy({
    ssl: true,
    connectInterceptor: function() {return true;}
});
