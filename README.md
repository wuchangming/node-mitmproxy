# node-mitmproxy
[![npm](https://img.shields.io/npm/dt/node-mitmproxy.svg)](https://www.npmjs.com/package/node-mitmproxy)  
基于nodejs 实现的MITM(中间人)代理

## 安装

###### windows
```
    npm install node-mitmproxy -g
```
###### Mac
```
    sudo npm install node-mitmproxy -g
```

## 生成CA根证书
```
    node-mitmproxy createCA
```

## 安装CA Root证书
###### Mac
```
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ~/node-mitmproxy/node-mitmproxy.ca.crt
```
###### windows
```
start %HOMEPATH%/node-mitmproxy/node-mitmproxy.ca.crt
```

## 启动代理
```
node-mitmproxy start
```


## 关于伪造https证书的逻辑图
<img src="design/node-MitmProxy https.png"/>
