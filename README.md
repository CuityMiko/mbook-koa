### **微书--后端项目**
新版微书后端代码，基于强大的Koa2.

### TODO
+ 上传书籍的时候自动更新最新章节

### 常见问题
#### 接口报错：`errmsg: 'E11000 duplicate key error collection: mbook.chapters index: num_1 dup key: { : 130 }'`
打开robomongo删除chapters表下的num_1的index，它的属性是unique，所以新增相同num的chapter的时候会出现这种错误，后来我删除了chapter表，并不在会出现chapter的num_1的索引，所以推断应该是数据恢复的时候带来的

#### 安装`node-canvas`
```
# ubuntu下运行
sudo apt-get install libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev build-essential g++
# mac OS下运行
brew install pkg-config cairo pango libpng jpeg giflib
cnpm install canvas --save
```

#### 从本地恢复远程数据库
为了方便数据同步，开发将不再使用本地数据库（主要是每次改了之后还得保存到本地，然后去另一台机器上恢复数据库，也因为这种数据不同步查了好多问题），以后都统一使用mlab。
```
# 从本地恢复mlab的数据库
mongorestore -h ds135680.mlab.com:35680 -d mbook -u admin -p 123456 本地数据库地址
# 备份mlab数据库到本地
mongodump -h ds135680.mlab.com:35680 -d mbook -u admin -p 123456 -o 需要存储的本地目录
```
#### ngrok代理本地500端口调试微信
需要使用ngrok将本地地址(http://localhost:5000)代理到一个外网可访问的地址，这样微信才会将回调发送到本地，提示支付结果。
点击[这里](https://www.ngrok.cc)修改隧道信息，点击[这里](https://www.ngrok.cc/download.html)下载ngrok客户端
+ 隧道id: `7c36398daca42677`
+ 访问地址: `http://ldk.free.ngrok.cc`
+ linux启动方式: `./sunny clientid 7c36398daca42677`
+ windows启动方式: 双击`ngrok.bat`

#### `windows`下`npm install`出错
![error](https://fs.andylistudio.com/1524550988546.png)
没有安装node-canvas的依赖包，请参考官网给的[说明](https://github.com/Automattic/node-canvas/wiki/Installation---Windows)
建议使用[choco](https://chocolatey.org)安装，打开cmd管理员界面，运行下面的代码：
```
# 安装choco
@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"

# 安装node-canvas依赖包
choco install -y python2 gtk-runtime microsoft-build-tools libjpeg-turbo

```
如果安装进度卡在visualstudio2017buildtools这里，需要自行下载[buildTools](https://www.visualstudio.com/zh-hans/downloads/)安装（搜索 Visual Studio 2017 生成工具）

如果出现未能加载 Visual C++ 组件“VCBuild.exe”的错误
请打开powershell，并以管理员身份运行下面的命令：
```
npm install --global --production windows-build-tools
npm install
```
#### 出现错误`E11000 duplicate key error index: mbook.chapters.$num_1`
mongo数据库出现不该有的索引，这是恢复老数据的时候带过来的，需要在数据库中手动删除索引
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
两方面原因：第一是因为ngxin的默认配置限制了只能传大于1M的文件，需要修改ngxin.conf
```
sudo vi /etc/ngxin/ngxin.conf
# 在http下新增一行
client_max_body_size 10M;
```
然后重启nginx

第二是koa使用bodyParser默认限制的问题，修改koa目录下的app.js
```
app.use(bodyparser({
  limit: '10mb',
  formLimit: '10mb',
  jsonLimit: '10mb',
  textLimit: '10mb',
}))
```

#### 实现分享的逻辑
在用户登录的时候调用获取用户分享信息的接口，接口会返回后台的分享配置，已经用户的邀请码、和分享朋友圈的图片地址、以及用户邀请获得的奖励信息
一个用户在share表中只能有一行
邀请码是唯一的
分享出去的页面会在page的url里带上邀请码
进来分享页面的时候，先根据邀请码定位到分享人，然后判断当前用户是否和分享人一致，如果不一致就发放奖励
