# node-mitmproxy
Node.js MITM proxy

## 关于伪造https证书的逻辑图
<img src="design/node-MitmProxy https.png"/>

## 安装CA Root证书
#### Mac
```
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ~/node-mitmproxy/node-mitmproxy.ca.crt
```
