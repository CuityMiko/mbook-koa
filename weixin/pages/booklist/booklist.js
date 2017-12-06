//booklist.js
const app = getApp()
const config = require('../../config')
const utils = require('../../utils/util')

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    spriteArr: [],
    myBooks: []
  },
  onShow: function(){
    let self = this
    self.getMyBookList()
  },
  onLoad: function () {
    let self = this
  },
  getMyBookList: function(){
    let self = this
    wx.request({
      url: config.base_url + '/api/booklist/mylist',
      header: { 'Authorization': 'Bearer ' + wx.getStorageSync('token') },
      success: res => {
        if(res.data.ok){
          let spriteNum = Math.ceil(res.data.list.length / 3)
          spriteNum = spriteNum > 3 ? spriteNum : 3
          let spriteArr = []
          for(let i=0; i<spriteNum; i++){
            spriteArr.push(0)
          }
          self.setData({ 'spriteArr': spriteArr, 'myBooks': res.data.list })
        }else{
          self.showToast('获取我的书单失败' + (res.data.msg ? '，' + res.data.msg : ''), 'bottom')
        }
      },
      fail: err => {
        self.showToast('获取我的书单失败', 'bottom')
      }
    })
  },
  openReader: function(event){
    wx.navigateTo({ url: '../reader/reader?bookid=' + event.currentTarget.dataset.bookid})
  },
  showToast: function(content, position){
    let self = this
    self.setData({ 'toast': { show: true, content: content, position: position } })
    setTimeout(function(){
      self.setData({ 'toast': { show: false, content: '', position: 'bottom' } })
    }, 3000)
  }
})
