Component({
  properties: {
    toast: {
      type: Object,
      value: { show: false, content: 'hello', position: 'bottom' }
    }
  },
  data: {
    opacity: 0,
  },
  ready: function(){
    let self = this
    self.setData({ 'opacity': .96, 'toast.show': false})
    setTimeout(function(){
      self.setData({ 'opacity': 0 })
      setTimeout(function(){
        self.setData({ 'toast.show': false })
      }, 1000)
    }, 3000)
  }
})
