import { setTimeout } from 'core-js/library/web/timers';

//index.js
//获取应用实例
const app = getApp()
const config = require('../../config')

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    clientHeight: '',
    banner_urls: [],
    is_show_banner: true,
    themes: [],
    click_times: {} // 换一批点击次数
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
    setTimeout(function(){
      self.setData({ 'toast': { show: true, content: '这是一个测试toast', position: 'bottom' } })
    }, 3000)
    // self.setData({ toastContent: 'caonima' })
  },
  getBanner: function(){
    let self = this
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
    wx.request({
      url: config.base_url + '/api/theme/index_list',
      success: function (res) {
        if (res.data.ok) {
          self.setData({ 'themes': res.data.list })
          // 初始化换一批的点击次数
          res.data.list.forEach(item => {
            if(item.flush){
              let tmpObj = {}
              tmpObj[item._id] = 1
              self.setData({click_times : Object.assign(self.data.click_times, tmpObj)})
            }
          })
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
  changeList: function(event){
    let self = this
    let theme_id = event.currentTarget.dataset.themeid
    let page = parseInt(self.data.click_times[theme_id])
    console.log(theme_id)
    if(theme_id){
      wx.request({
        url: config.base_url + '/api/theme/change_list?page=' + page + '&theme_id=' + theme_id,
        success: function (res) {
          if (res.data.ok) {
            // 局部更新
            let thisIndex = -1
            self.data.themes.forEach((item, index) => {
              if(item._id == theme_id){
                thisIndex = index
              }
            })
            if(thisIndex > -1){
              let key1 = 'themes[' + thisIndex + '].books'
              let key2 = 'click_times.' + theme_id
              self.setData({ [key1]: res.data.list, [key2]: page + 1})
            }
          } else {
            // 隐藏banner
            self.setData({ 'is_show_banner': false })
          }
        },
        fail: function (err) {
          self.setData({ 'is_show_banner': false })
        }
      })
    }
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
