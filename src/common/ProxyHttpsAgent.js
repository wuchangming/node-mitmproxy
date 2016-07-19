var HttpsAgentOrigin = require('agentkeepalive').HttpsAgent;

module.exports = class HttpsAgent extends HttpsAgentOrigin{
    // Hacky
    getName (option) {
        var name = HttpsAgentOrigin.prototype.getName.call(this, option);
        name += ':';
        if (option.customSocketId) {
            name += option.customSocketId
        }
        return name;
    }
}
