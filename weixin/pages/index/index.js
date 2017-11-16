//index.js
//获取应用实例
const app = getApp()
const config = require('../../config')

Page({
  data: {
    clientHeight: '',
    banner_urls: [],
    is_show_banner: true,
    themes: []
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function () {
    let self = this
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
    // 获取屏幕高度
    wx.getSystemInfo({
      success: function (res) {
        self.setData({
          clientHeight: res.windowHeight
        });
      }
    })
    // 获取banner
    self.getBanner()
    self.getTheme()
  },
  getBanner: function(){
    let self = this
    // 先从本地获取缓存
    wx.request({
      url: config.base_url + '/api/get_banner',
      success: function(res){
        if(res.data.ok){
          self.setData({ 'banner_urls': res.data.list })
        }else{
          // 隐藏banner
          self.setData({is_show_banner: false})
        }
      },
      fail: function(err){
        self.setData({ is_show_banner: false })
      }
    })
  },
  getTheme: function () {
    let self = this
    // 先从本地获取缓存
    wx.request({
      url: config.base_url + '/api/theme/index_list',
      success: function (res) {
        if (res.data.ok) {
          self.setData({ 'themes': res.data.list })
        } else {
          // 隐藏banner
          self.setData({ 'is_show_banner': false })
        }
      },
      fail: function (err) {
        self.setData({ 'is_show_banner': false })
      }
    })
  },
  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  }
})
