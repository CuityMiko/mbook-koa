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
    prises: [
      { prise: 10, yuebi: 1000, selected: false },
      { prise: 30, yuebi: 3500, selected: false },
      { prise: 50, yuebi: 6000, selected: false },
      { prise: 100, yuebi: 12000, selected: false }
    ]
  },
  onLoad: function (options) {
    let self = this
    // 获取屏幕高度
    if(options.url){
      self.setData({ 'url': options.url })
    }else{
      self.showToast('地址为空', 'bottom')
    }
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
  showToast: function(content, position){
    let self = this
    self.setData({ 'toast': { show: true, content: content, position: position } })
    setTimeout(function(){
      self.setData({ 'toast': { show: false, content: '', position: 'bottom' } })
    }, 3000)
  }
})
