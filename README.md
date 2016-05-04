# node-mitmproxy v2.X 开发中
[![npm](https://img.shields.io/npm/dt/node-mitmproxy.svg)](https://www.npmjs.com/package/node-mitmproxy)  
基于nodejs 实现的MITM(中间人)代理

支持https:  
<img src="doc/img/example1.jpg" width="350px"/>


## 安装

###### windows
```
    npm install node-mitmproxy@next -g
```
###### Mac
```
    sudo npm install node-mitmproxy@next -g
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
注: 证书需要安装到  ** 受信任的根证书目录 ** 下  
参考 [issues#3](https://github.com/wuchangming/node-mitmproxy/issues/3)
```
start %HOMEPATH%/node-mitmproxy/node-mitmproxy.ca.crt
```

## 启动代理
```
node-mitmproxy start
```


## 关于伪造https证书的逻辑图
<img src="doc/img/node-MitmProxy https.png"/>
