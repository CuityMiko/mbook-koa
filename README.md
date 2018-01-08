### 阅读应用
新版微书,继续完成吧~

### mongo的备份和恢复
由于开发都是连接的本地mongodb,所以在公司和家里的数据时常有些不同步,需要使用mongo的命令做同步.
1. windows备份
  ```
  cd D:/mongo/bin
  D:
  mongodump --host localhost --port 27017 --db mbook --out D:\PROJECT\work01_book_read_app\dump  (ths)
  ./mongodump.exe --host localhost --port 27017 --db mbook E:/work01_book_read_app/dump  (home)
  ```
2. windows恢复
  ```
  cd D:/mongo/bin
  D:
  mongorestore --host localhost --port 27017 --db mbook D:\PROJECT\work01_book_read_app\dump\mbook  (ths)
  ./mongorestore.exe --host localhost --port 27017 --db mbook E:/work01_book_read_app/dump/mbook  (home)
  ``` 
3. linux备份
```
sudo mongodump --host localhost --port 27017 --db mbook /home/andyliwr/文档/work01_book_read_app/dump/mbook
```
4. linux恢复
```
sudo mongorestore --host localhost --port 27017 --db mbook /home/andyliwr/文档/work01_book_read_app/dump/mbook
```

### 思考
1. 如何做登录状态的维护
先调用wx.login 拿到code，在调用wx.getUserInfo并带上参数withCredentials，拿到rawData， signature， encryptedData， iv，并和code一起传送到后端，后端根据code发送微信认证请求，将拿到的openid和session_key配合rawData， signature， encryptedData， iv解析出unionid，然后判断此unionid是否在已经存在于某个用户中，如果存在直接使用jwt生成一个token并联合用户的一些其他信息返回回去。如果不存在，说明用户还未注册，直接引导用户前往注册页，在填写手机号码之后发送验证码，手机验证通过之后后台结合用户信息，为用户生成账号，并返回token和用户信息

关于第三方登录和微信登录过期时间不同步的问题，如果两者设置一样的过期时间，因为小程序在使用的过程中，微信登录状态会一直不过期(这点可以去查官方文档)，但是jwt可能会过期。解决方案：使用koa中间件处理401请求，区分路由未找到和无权限，并对无权限做处理，将页面重定向到一个空白页面，这个页面js里执行重新登录代码，来刷新token值
```
wx.checkSession({
  success: function(){
    //session 未过期，并且在本生命周期一直有效
    self.globalData.token = wx.getStorageSync('token')
  },
  fail: function(){
    // 登录态过期
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              self.globalData.userInfo = res.userInfo
              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (self.userInfoReadyCallback) {
                self.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
    self.doLogin() //重新登录
  }
})
```
  分页算法，参考https://yd.baidu.com/view/72b62bb1680203d8ce2f248c

### setting的栏目
1. 阅读器模式
  + 字体
  + 模式
  + 字体大小
2. 更新提醒
3. 帮助与反馈
4. 关注公众号
5. 退出当前账号

### ngrok代理本地500端口调试微信
+ 隧道id: `2be12d1c071de987`
+ 访问地址: `http://ldk.free.ngrok.cc`
+ linux启动方式: `./sunny clientid 2be12d1c071de987`
+ windows启动方式: 双击`ngrok.bat`

### 微信支付demo
[NideShop：基于Node.js+MySQL开发的开源商城](https://github.com/tumobi/nideshop-mini-program)

### loading动画地址
[loading](https://loading.io/icon/custom/95323/)
