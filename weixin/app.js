//app.js
const config = require('./config')
const utils = require('./utils/util')

App({
  onLaunch: function () {
    // wx.checkSession({
    //   success: function(){
    //     //session 未过期，并且在本生命周期一直有效
    //     self.globalData.token = wx.getStorageSync('token')
    //   },
    //   fail: function(){
    //     //登录态过期
    //     self.doLogin() //重新登录
    //   }
    // })
    this.doLogin()
  },
  doLogin: () => {
    let self = this
    // 微信登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        let code = res.code
        if (code) {
          wx.request({
            method: 'POST',
            url: config.base_url + '/api/user/login',
            data: {
              identity: 'appuser',
              code: code
            },
            success: res => {
              if(res.data.ok){
                // 将token存入缓存，在每次发送需要认证的请求时在header里带上token
                wx.setStorageSync('token', res.data.token)
                wx.setStorageSync('userinfo', res.data.userinfo)
              }else if(!res.data.ok && !res.data.token && !res.data.registe){
                // 未注册
                wx.login({
                  success: res => {
                    let code = res.code
                    if(res.code){
                      // 获取用户信息后，发送registe请求
                      wx.getSetting({
                        success: res => {
                          if (res.authSetting['scope.userInfo']) {
                            // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
                            wx.getUserInfo({
                              success: res => {
                                // 可以将 res 发送给后台解码出 unionId
                                wx.request({
                                  method: 'POST',
                                  url: config.base_url + '/api/user/registe',
                                  data: Object.assign({ identity: 'appuser', code: code }, res.userInfo),
                                  success: res => {
                                    if(res.data.ok){
                                      wx.setStorageSync('token', res.data.token)
                                      wx.setStorageSync('userinfo', res.data.userinfo)
                                    }else{
                                      wx.showToast({ title: '注册失败，' + res.data.msg, image: '/static/img/close.png' })
                                    }
                                  },
                                  fail: err => {
                                    wx.showToast({ title: '注册失败', image: '/static/img/close.png' })
                                  }
                                })
                              }
                            })
                          }
                        }
                      })
                    }
                  },
                  fail: err => {
                    wx.showToast({ title: '注册失败', image: '/static/img/close.png' })
                  }
                })
              }
            },
            fail: err => {
              wx.showToast({ title: '登录失败', image: '/static/img/close.png' })
            }
          })
        } else {
          wx.showToast({ title: '登录失败', image: '/static/img/close.png' })
        }
      }
    })
  },
  doRegiste: function(){
    
  },
  globalData: {
    userInfo: null
  }
})
