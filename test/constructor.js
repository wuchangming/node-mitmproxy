var MitmProxy = require('../lib');
// MitmProxy转发时信任任何证书
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'
var proxy = new MitmProxy({
    ssl: true,
    sslConnectInterceptor: function() {return true;}
});
