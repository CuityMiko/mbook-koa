// classify.js
Page({
  data: {
    toast: { show: false, content: '', position: 'bottom' }, // 提示信息
    classifyData: [],
    currentIndex: 0,
    scrollTop: { scrollTop_value: 0, backTop_show: false }
  },
  onLoad: function (options) {
    var self = this
    //显示加载中
    wx.showToast({ title: '加载中', icon: 'loading' })
    //根据url中传过来的分类index，加载指定的分类数据，index默认值1
    wx.request({
      url: '',
      header: { 'content-type': 'application/json' },
      success: function (res) {
        //隐藏加载信息
        setTimeout(function () { wx.hideToast() }, 500)
        if (res.data.ok) {
          self.setData({ classifyData: res.data.list })
        } else {
          if (res.data.msg) {
            self.showToast(res.data.msg, 'bottom')
          }
        }
      },
      error: function (err) {
        setTimeout(function () {
          wx.hideToast()
          self.showToast('获取分类数据失败~', 'bottom')
        }, 500)
      }
    })
  },
  showRank: function (event) {
    this.setData({ currentIndex: event.currentTarget.dataset.index });
  },
  scrollFun: function (event) {
    if (event.detail.scrollTop > 300) {//触发backtop的显示条件  
      this.setData({
        'scrollTop.backTop_show': true
      })
    } else {
      this.setData({
        'scrollTop.backTop_show': false
      })
    }
  },
  backToTop: function () {
    var topValue = this.data.scrollTop.scrollTop_value //发现设置scroll-top值不能和上一次的值一样，否则无效，所以这里加了个判断  
    if (topValue == 1) {
      topValue = 0
    } else {
      topValue = 1
    }
    this.setData({
      'scrollTop.scrollTop_value': topValue
    })
  },
  gotoBookDetail: function (event) {
    var bookId = event.currentTarget.dataset.bookid
    wx.navigateTo({
      url: '../book_detail/book_detail?bookId=' + bookId
    })
  },
  // 弹出消息函数
  showToast: function (content, position) {
    let self = this
    self.setData({ 'toast': { show: true, content: content, position: position } })
    setTimeout(function () {
      self.setData({ 'toast': { show: false, content: '', position: 'bottom' } })
    }, 3000)
  }
});
