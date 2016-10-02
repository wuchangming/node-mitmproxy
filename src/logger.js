const colors = require('colors')

exports = logger;

let silence = false;

logger.logger = function (_silence) {
    silence = _silence
}

logger.log = function (msg) {
    if (!silence) {
        console.log(msg);
    }
}

logger.warning = function (msg) {
    logger.log(colors.cyan(msg));
}

logger.success = function (msg) {
    logger.log(colors.green(msg));
}

logger.error = function (msg) {
    logger.log(colors.red(msg));
}
