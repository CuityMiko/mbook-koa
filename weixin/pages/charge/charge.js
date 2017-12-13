// pages/setting/charge.js
const app = getApp()
const config = require('../../config')
const utils = require('../../utils/util')

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    currentPageNum: 1,
    payNum: 0,
    willGetYuebiNum: 0,
    url: '',
    prises: []
  },
  onLoad: function (options) {
    let self = this
    self.getChargeGood()
  },
  select: function(event){
    let num = parseInt(event.currentTarget.dataset.num)
    let key = 'prises['+ num + '].selected'
    this.setData({ [key]: !this.data.prises[num].selected })
    let payNum = 0
    let willGetYuebiNum = 0
    this.data.prises.forEach(item => {
      if(item.selected){
        payNum += item.prise
        willGetYuebiNum += item.yuebi
      }
    })
    this.setData({ 'payNum': payNum, 'willGetYuebiNum': willGetYuebiNum  })
  },
  changePage: function(event){
    let page = parseInt(event.currentTarget.dataset.page)
    this.setData({ 'currentPageNum': page })
  },
  getChargeGood: function(){
    let self = this
    wx.request({
      method: 'GET',
      url: config.base_url + '/api/charge',
      success: res => {
        if(res.data.ok){
          let prises = res.data.list.map(item => {
            item.selected = false
            return item
          })
          self.setData({ 'prises': prises })
        }else{
          self.showToast('获取充值商品失败' + (res.data.msg ? '，' + res.data.msg : ''), 'bottom')
        }
      },
      fail: err => {
        self.showToast('获取充值商品失败', 'bottom')
      }
    })
  },
  // 获取本地ip
  getLocalIPAddress: function(){
    wx.request({
      url: 'http://ip-api.com/json',
      success:function(e){
        that.setData({
          motto:e.data
        })
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
