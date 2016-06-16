
// demo说明：
// 拦截所有服务器响应在html中注入 样式 '<style>body {background:red !important}</style>'

var through = require('through2');
var zlib = require('zlib');
var url = require('url');
var charset = require('charset');
var iconv = require('iconv-lite');
var jschardet = require('jschardet');

var httpUtil = {}
httpUtil.isGzip = function (res) {
    var contentEncoding = res.headers['content-encoding'];
    return !!(contentEncoding && contentEncoding.toLowerCase() == 'gzip');
}
httpUtil.isHtml = function (res) {
    var contentType = res.headers['content-type'];
    return (typeof contentType != 'undefined') && /text\/html|application\/xhtml\+xml/.test(contentType);
}

function injectScriptIntoHtml(html, script) {
    html = html.replace(/(<\/head>)/i, function (match) {
        return script + match;
    });
    return html;
}

function chunkReplace (_this, chunk, enc, callback, injectScriptTag, proxyRes) {
    var _charset = charset(proxyRes, chunk) || jschardet.detect(chunk).encoding.toLowerCase();
    var chunkString;
    if (_charset != null && _charset != 'utf-8') {
        chunkString = iconv.decode(chunk, _charset);
    } else {
        chunkString = chunk.toString();
    }

    var newChunkString = injectScriptIntoHtml(chunkString, injectScriptTag);

    var buffer;
    if (_charset != null && _charset != 'utf-8') {
        buffer = iconv.encode(newChunkString, _charset);
    } else {
        buffer = new Buffer(newChunkString);
    }

    _this.push(buffer);
    callback();
}

module.exports = {
    sslConnectInterceptor: (req, cltSocket, head) => {

        var srvUrl = url.parse(`https://${req.url}`);

        // 忽略微信的推广页
        if (srvUrl.host === 'mp.weixin.qq.com:443') {
            return false;
        }
        // 只拦截浏览器的https请求
        if (req.headers && req.headers['user-agent'] && /^Mozilla/.test(req.headers['user-agent'])) {
            return true
        } else {
            return false
        }
    },
    responseInterceptor: (req, res, proxyReq, proxyRes, ssl, next) => {
        var isHtml = httpUtil.isHtml(proxyRes);
        var contentLengthIsZero = (() => {
            return proxyRes.headers['content-length'] == 0;
        })();
        if (!isHtml || contentLengthIsZero) {
            next();
        } else {
            Object.keys(proxyRes.headers).forEach(function(key) {
                if(proxyRes.headers[key] != undefined){
                    var newkey = key.replace(/^[a-z]|-[a-z]/g, (match) => {
                        return match.toUpperCase()
                    });
                    var newkey = key;
                    if (isHtml && key === 'content-length') {
                        // do nothing
                    } else {
                        res.setHeader(newkey, proxyRes.headers[key]);
                    }
                }
            });

            res.writeHead(proxyRes.statusCode);

            var isGzip = httpUtil.isGzip(proxyRes);

            if (isGzip) {
                proxyRes.pipe(new zlib.Gunzip())
                .pipe(through(function (chunk, enc, callback) {
                    chunkReplace(this, chunk, enc, callback, '<style>body {background:red !important}</style>', proxyRes);
                })).pipe(new zlib.Gzip()).pipe(res);
            } else {
                proxyRes.pipe(through(function (chunk, enc, callback) {
                    chunkReplace(this, chunk, enc, callback, '<style>body {background:red !important}</style>', proxyRes);
                })).pipe(res);
            }
        }
        next();
    }
};
