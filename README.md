### **微书--后端项目**

新版微书后端代码，基于强大的 Koa2.

### TODO

- 上传书籍的时候自动更新最新章节
- 好友助力

### 常见问题

#### 接口报错：`errmsg: 'E11000 duplicate key error collection: mbook.chapters index: num_1 dup key: { : 130 }'`

打开 robomongo 删除 chapters 表下的 num_1 的 index，它的属性是 unique，所以新增相同 num 的 chapter 的时候会出现这种错误，后来我删除了 chapter 表，并不在会出现 chapter 的 num_1 的索引，所以推断应该是数据恢复的时候带来的

#### 安装`node-canvas`

```
# ubuntu下运行
sudo apt-get install libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev build-essential g++
# mac OS下运行
brew install pkg-config cairo pango libpng jpeg giflib
cnpm install canvas --save
```

#### 从本地恢复远程数据库

为了方便数据同步，开发将不再使用本地数据库（主要是每次改了之后还得保存到本地，然后去另一台机器上恢复数据库，也因为这种数据不同步查了好多问题），以后都统一使用 mlab。

```
# 从本地恢复mlab的数据库
mongorestore -h ds135680.mlab.com:35680 -d mbook -u admin -p 123456 本地数据库地址
# 备份mlab数据库到本地
mongodump -h ds135680.mlab.com:35680 -d mbook -u admin -p 123456 -o 需要存储的本地目录
```

#### ngrok 代理本地 500 端口调试微信

需要使用 ngrok 将本地地址(http://localhost:5000)代理到一个外网可访问的地址，这样微信才会将回调发送到本地，提示支付结果。
点击[这里](https://www.ngrok.cc)修改隧道信息，点击[这里](https://www.ngrok.cc/download.html)下载 ngrok 客户端

- 隧道 id: `7c36398daca42677`
- 访问地址: `http://ldk.free.ngrok.cc`
- linux 启动方式: `./sunny clientid 7c36398daca42677`
- windows 启动方式: 双击`ngrok.bat`

#### `windows`下`npm install`出错

![error](https://fs.andylistudio.com/1524550988546.png)
没有安装 node-canvas 的依赖包，请参考官网给的[说明](https://github.com/Automattic/node-canvas/wiki/Installation---Windows)
建议使用[choco](https://chocolatey.org)安装，打开 cmd 管理员界面，运行下面的代码：

```
# 安装choco
@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"

# 安装node-canvas依赖包
choco install -y python2 gtk-runtime microsoft-build-tools libjpeg-turbo
```

如果安装进度卡在 visualstudio2017buildtools 这里，需要自行下载[buildTools](https://www.visualstudio.com/zh-hans/downloads/)安装（搜索 Visual Studio 2017 生成工具）

如果出现未能加载 Visual C++ 组件“VCBuild.exe”的错误
请打开 powershell，并以管理员身份运行下面的命令：

```
npm install --global --production windows-build-tools
npm install
```

#### 出现错误`E11000 duplicate key error index: mbook.chapters.$num_1`

mongo 数据库出现不该有的索引，这是恢复老数据的时候带过来的，需要在数据库中手动删除索引

```
mongo
show db;
use mbook;
# 查看所有索引，并找到name为num_1的索引
db.system.indexes.find()
# 删除索引
db.chapters.dropIndex("num_1")
```

#### 导入章节接口出现 413 错误：request entity too large

两方面原因：第一是因为 ngxin 的默认配置限制了只能传大于 1M 的文件，需要修改 ngxin.conf

```
sudo vi /etc/ngxin/ngxin.conf
# 在http下新增一行
client_max_body_size 10M;
```

然后重启 nginx

第二是 koa 使用 bodyParser 默认限制的问题，修改 koa 目录下的 app.js

```
app.use(bodyparser({
  limit: '10mb',
  formLimit: '10mb',
  jsonLimit: '10mb',
  textLimit: '10mb',
}))
```

#### redis 出现错误`MISCONF Redis is configured to save RDB snapshots, but is currently not able to persist on disk.`

打开 redis-cli 输入`config set stop-writes-on-bgsave-error no`

#### 实现分享的逻辑

在用户登录的时候调用获取用户分享信息的接口，接口会返回后台的分享配置，已经用户的邀请码、和分享朋友圈的图片地址、以及用户邀请获得的奖励信息
一个用户在 share 表中只能有一行
邀请码是唯一的
分享出去的页面会在 page 的 url 里带上邀请码
进来分享页面的时候，先根据邀请码定位到分享人，然后判断当前用户是否和分享人一致，如果不一致就发放奖励

### Koa 调试

```
{
  "type": "node",
  "request": "launch",
  "name": "mbook-koa",
  "runtimeExecutable": "nodemon",
  "program": "${workspaceRoot}/bin/run",
  "restart": true,
  "console": "integratedTerminal",
  "skipFiles": ["${workspaceRoot}/node_modules/**/*.js", "<node_internals>/**/*.js"]
}
```

### mongo 和 redis 开启认证

#### mongodb

```shell
# 创建整个数据库的管理员
use admin;
db.createUser({user: 'admin', pwd: 'xxx', roles: [{role: 'userAdminAnyDatabase', db: 'admin'}]})
db.auth('admin', 'xxx');

# 创建单个数据库的管路员
use mbook-test;
db.createUser({user: 'mbookTest', pwd: 'xxx', roles:[{ role:'dbOwner', db: 'mbook-test'}]})
db.auth('mbookTest', 'xxx');

# 编辑配置文件
sudo vi /etc/mongodb.conf
# 修改host为0.0.0.0，修改auth为true
sudo service mongodb restart
```

#### redis

```
sudo vi /etc/redis/redis.conf
# 修改ip为0.0.0.0， 修改requirepass后面的值为你设置的密码
sudo service redis-server restart
```

### 命令行连接 mongo 的命令

```
mongo 127.0.0.1/admin -u admin -p
```

### 服务器迁移

```
# A服务器打包
sudo mongodump -h localhost:27017 -d mbook-new -u mbook -p 121960425mbook -o ./
# 直接全量恢复B服务器的数据库
sudo mongorestore -h 118.24.94.40:27017 -d mbook-new -u mbook -p 121960425mbook mbook-new/ --drop
# 打包导出的数据
sudo tar -cvf mbook-new.tar.gz mbook-new/
```

### 运行自动化脚本

bin 下面每个脚本都有自己的用途，请参照说明

```
runkoa bin/checkUserBookList.js
```

### POST 请求出现 413 错误

![413错误](https://fs.andylistudio.com/1542121256941.png)
多半是由于 ngxin 对 http 请求 body 大小的限制，修改 nginx 配置文件 nginx.conf，在 http 的下面加上 `client_max_body_size 2m;` 的限制
