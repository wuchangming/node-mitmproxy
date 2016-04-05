'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var tlsUtils = require('./tlsUtils');

module.exports = function () {
    function CertAndKeyContainer() {
        var maxLength = arguments.length <= 0 || arguments[0] === undefined ? 1000 : arguments[0];

        _classCallCheck(this, CertAndKeyContainer);

        this.queue = [];
        this.maxLength = maxLength;
    }

    _createClass(CertAndKeyContainer, [{
        key: 'addCert',
        value: function addCert(_ref) {
            var cert = _ref.cert;
            var key = _ref.key;

            if (this.queue.length >= this.maxLength) {
                this.queue.shift();
            }

            var mappingHostNames = tlsUtils.getMappingHostNamesFormCert(cert);

            var certObj = {
                mappingHostNames: mappingHostNames,
                cert: cert,
                key: key
            };

            this.queue.push(certObj);

            return certObj;
        }
    }, {
        key: 'getCert',
        value: function getCert(hostname) {
            for (var i = 0; i < this.queue; i++) {
                var certObj = this.queue[i];
                var mappingHostNames = certObj.mappingHostNames;
                for (var j = 0; j < mappingHostNames.length; j++) {
                    var DNSName = mappingHostNames[j];
                    if (tlsUtils.isMappingHostName(DNSName, hostname)) {
                        this.reRankCert(i);
                        return rCert;
                    }
                }
            }
            return null;
        }
    }, {
        key: 'reRankCert',
        value: function reRankCert(index) {
            // index ==> queue foot
            this.queue.push(this.queue.splice(index, 1)[0]);
        }
    }]);

    return CertAndKeyContainer;
}();