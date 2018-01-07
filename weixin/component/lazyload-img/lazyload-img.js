Component({
  properties: {
    mode: {
      type: String,
      value: 'scaleToFill'
    },
    src: {
      type: String,
      value: '../../static/img/book-loading.svg' // 默认加载loading图片
    }
  },
  data: {
    animation: ''
  },
  methods: {
    imgLoad: function (event) {
      console.log(event)
    },
    imgError: function(event){
      console.log(event)
    }
  }
})
