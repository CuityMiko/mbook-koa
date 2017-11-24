//booklist.js
const app = getApp()
const config = require('../../config')
const utils = require('../../utils/util')

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' } // 提示信息
  },
  onLoad: function () {
    let self = this
    self.getMyBookList()
  },
  getMyBookList: function(){
    let self = this
    wx.request({
      url: config.base_url + '/api/booklist/mylist',
      header: { 'Authorization': 'Bearer ' + wx.getStorageSync('token') },
      success: res => {
        if(res.data.ok){
        }else{
          self.showToast('获取我的书单失败' + (res.data.msg ? '，' + res.data.msg : ''), 'bottom')
        }
      },
      fail: err => {
        self.showToast('获取我的书单失败', 'bottom')
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
