var _ = require('lodash');
module.exports = (middlewares) => {
    if (middlewares) {
        if (Object.prototype.toString.call(middlewares) !== '[object Array]') {
            throw new TypeError('middlewares must be a array');
        }
    }

    var sslConnectInterceptors = [];
    var requestInterceptors = [];
    var responseInterceptors = [];

    _.each(middlewares, (m) => {
        if (m.buildIn === false || m.buildIn === 'false') {

        } else {
            m.name
        }
    })


}
