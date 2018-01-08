// pages/user/user.js
const config = require('../../config')

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    userInfo: null,
    text: ''
  },
  onLoad: function () {
    let self = this
    // 获取屏幕高度
    self.setData({ 'userInfo': wx.getStorageSync('userinfo') })
    self.getText()
  },
  getText: function(){
    let self = this
    wx.request({
      url: config.base_url + '/api/get_text',
      success: res => {
        if(res.data.ok){
          self.setData({ 'text': res.data.text })
        }
      }
    })
  },
  showToast: function(content, position){
    let self = this
    self.setData({ 'toast': { show: true, content: content, position: position } })
    setTimeout(function(){
      self.setData({ 'toast': { show: false, content: '', position: 'bottom' } })
    }, 3000)
  }
})
