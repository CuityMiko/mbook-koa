//bookdetail.js
const app = getApp()
const config = require('../../config')
const utils = require('../../utils/util')

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    detail: {},

  },
  onLoad: function (options) {
    let self = this
    wx.setNavigationBarTitle({ title: options.name })
    wx.showNavigationBarLoading()
    self.getBookDetail(options.id)
  },
  getBookDetail: function(id){
    let self = this
    if(id){
      wx.request({
        url: config.base_url + '/api/book/get_detail?id=' + id,
        success: function(res){
          if(res.data.ok){
            self.setData({ 'detail': res.data.data })     
          }else{
            self.showToast('获取书籍信息失败', 'bottom')
          }
        },
        fail: function(err){
          self.showToast('获取书籍信息失败', 'bottom')
        }
      })
    }else{
      self.showToast('获取书籍信息失败', 'bottom')
    }
  },
  showToast:function(content, position){
    let self = this
    self.setData({ 'toast': { show: true, content: content, position: position } })
    setTimeout(function(){
      self.setData({ 'toast': { show: false, content: '', position: 'bottom' } })
    }, 3000)
  }
})
