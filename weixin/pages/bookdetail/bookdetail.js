//bookdetail.js
const app = getApp()
const config = require('../../config')
const utils = require('../../utils/util')

Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    detail: {},
    isInList: false,
    bookid: '',
    showAllDes: false
  },
  onLoad: function (options) {
    let self = this
    wx.setNavigationBarTitle({ title: options.name })
    wx.showNavigationBarLoading()
    self.getBookDetail(options.id)
    self.setData({ bookid: options.id })
  },
  getBookDetail: function(id){
    let self = this
    if(id){
      wx.request({
        url: config.base_url + '/api/book/get_detail?id=' + id,
        header: {
          'Authorization': 'Bearer ' + wx.getStorageSync('token')
        },
        success: function(res){
          if(res.data.ok){
            // devide des into shortDes and des;
            let shortDes = ''
            // format des
            let des = res.data.data.des
            res.data.data.des = des.replace(/( ){2,}/, ' ');
            if (des.length > 95) {
              shortDes = des.substring(0, 70) + '...';
            }
            console.log(des.length, shortDes)
            res.data.data.shortDes = shortDes;
            self.setData({ 'detail': res.data.data, isInList: res.data.isInList })     
            wx.showNavigationBarLoading()
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
  showAllDes: function () {
    if (this.data.detail.shortDes) {
      if (this.data.showAllDes) {
        this.setData({showAllDes: false})
      } else {
        this.setData({showAllDes: true})
      }
    }
  },
  addOrRemove: function(){
    let self = this
    if(self.data.isInList){
      wx.request({
        url: config.base_url + '/api/booklist/remove_book?id=' + self.data.bookid,
        header: {
          'Authorization': 'Bearer ' + wx.getStorageSync('token')
        },
        success: function(res){
          if(res.data.ok){
            self.showToast('从书架中移除成功', 'bottom')
            self.setData({isInList: false})
          }else{
            self.showToast(res.data.msg, 'bottom')
          }
        },
        fail: function(err){
          self.showToast('从书架中移除失败，请重新尝试', 'bottom')
        }
      })
    }else{
      wx.request({
        url: config.base_url + '/api/booklist/add_book?id=' + self.data.bookid,
        header: {
          'Authorization': 'Bearer ' + wx.getStorageSync('token')
        },
        success: function(res){
          if(res.data.ok){
            wx.showToast({title: '加入书架成功', icon: 'success'})
            self.setData({isInList: true})
          }else{
            self.showToast(res.data.msg, 'bottom')
          }
        },
        fail: function(err){
          self.showToast('加入书架失败，请重新尝试～', 'bottom')
        }
      })
    }
  },
  showToast: function(content, position){
    let self = this
    self.setData({ 'toast': { show: true, content: content, position: position } })
    setTimeout(function(){
      self.setData({ 'toast': { show: false, content: '', position: 'bottom' } })
    }, 3000)
  }
})
