//bookdetail.js
const app = getApp()
const config = require('../../config')

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' } // 提示信息
  },
  onLoad: function (options) {
    let self = this
    wx.setNavigationBarTitle({ title: options.name })
    wx.showNavigationBarLoading()
  },
  showToast:function(content, position){
    let self = this
    self.setData({ 'toast': { show: true, content: content, position: position } })
    setTimeout(function(){
      self.setData({ 'toast': { show: false, content: '', position: 'bottom' } })
    }, 3000)
  }
})
