exports = config;

// proxy default listening port
config.DEFAULT_PORT = 6789;

config.CA_NAME = 'node-mitmproxy CA';

function getDefaultCABasePath() {
    var userHome = process.env.HOME || process.env.USERPROFILE;
    return path.resolve(userHome, './.node-mitmproxy');
}

const caCertFileName = 'node-mitmproxy.ca.crt';
const caKeyFileName = 'node-mitmproxy.ca.key.pem';

config.DEFAULT_CA_CERT_PATH = path.resolve(config.getDefaultCABasePath(), caCertFileName);

config.DEFAULT_CA_KEY_PATH = path.resolve(config.getDefaultCABasePath(), caKeyFileName);

config.DEFAULT_OUTPUT_CERT_FILES_PATH = path.resolve(config.getDefaultCABasePath(), 'cert');

config.LOCAL_IP = '127.0.0.1';

config.MIDDLEWARE_API_sslConnectInterceptor = 'sslConnectInterceptor';

config.MIDDLEWARE_API_requestInterceptor = 'requestInterceptor';

config.MIDDLEWARE_API_responseInterceptor = 'responseInterceptor';
