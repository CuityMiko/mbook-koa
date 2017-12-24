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
    localIp: '0.0.0.0',
    prises: [],
    chargeResult: 'success',
  },
  onLoad: function (options) {
    let self = this
    self.getChargeGood()
  },
  showToast: function(content, position){
    let self = this
    self.setData({ 'toast': { show: true, content: content, position: position } })
    setTimeout(function(){
      self.setData({ 'toast': { show: false, content: '', position: 'bottom' } })
    }, 3000)
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
  doPay: function(){
    let self = this
    // 向后端请求支付参数
    let selectPrise = this.data.prises.filter(item => {
      return item.selected
    })
    wx.showLoading({
      title: '调用微信支付',
    })
    wx.request({
      method: 'POST',
      url: config.base_url + '/api/pay',
      header: { 'Authorization': 'Bearer ' + wx.getStorageSync('token') },
      data: {
        chargeids: selectPrise.map(item => { return item.id }),
        pay_money: 1, // this.data.payNum
        yuebi_num: this.data.willGetYuebiNum,
        spbill_create_ip: this.data.localIp || '0.0.0.0'
      },
      success: res => {
        wx.requestPayment({
          'timeStamp': res.data.params.timeStamp,
          'nonceStr': res.data.params.nonceStr,
          'package': res.data.params.package,
          'signType': res.data.params.signType,
          'paySign': res.data.params.paySign,
          'success': res => {
            wx.hideLoading()
            // 前往支付成功页面
          },
          'fail': err => {
            console.log(err)
            wx.hideLoading()
            // 前往支付失败页面
            console.log('支付失败了')
          }
       })
      },
      fail: err => {
        wx.hideLoading()
        self.showToast('请求支付参数失败', 'bottom')
      }
    })
  }
})
