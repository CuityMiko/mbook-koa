import { Theme, Book } from '../models'
import { Array } from 'core-js/library/web/timers';

function unique(arr){
  var res=[];
  for(var i=0,len=arr.length;i<len;i++){
      var obj = arr[i];
      for(var j=0,jlen = res.length;j<jlen;j++){
          if(res[j]===obj) break;            
      }
      if(jlen===j)res.push(obj);
  }
  return res;
}

export default function (router) {
  // 首页获取栏目数据的接口
  router.get('/api/theme/index_list', async (ctx, next) => {
    // 查找出所有的需要显示的栏目
    let result = []
    let allThemes = await Theme.find({show: true}, 'name layout flush books').sort({priority: -1})
    for(let i=0; i<allThemes.length; i++){
      let bookList = []
      let num = 3
      switch(allThemes[i].layout){
        case 1:
          num = 4
          break
        case 2:
          num = 3
          break
        case 3:
          num = 3
          break
        case 4:
          num = 6
          break
        default:
          break
      }
      for(let k=0; k<allThemes[i].books.length; k++){
        // 布局2只需要排名前三的书籍
        if(k >= num){
          break
        }else{
          let tmpBook = await Book.findById(allThemes[i].books[k].bookid)
          if(tmpBook){
            bookList.push(tmpBook)
          }
        }
      }
      allThemes[i].books = bookList
    }
    ctx.body = { ok: true, msg: '获取栏目成功', list: allThemes }
  })

  // 点击换一批对应的接口
  router.get('/api/theme/change_list', async (ctx, next) => {
    let { page, theme_id } = ctx.request.query
    if(page){
      page = parseInt(page)
      if(page < 1){
        page =1
      }
    }else{
      page = 1
    }
    if(theme_id){
      // 查找出所有的需要显示的栏目
      let result = []
      
      let thisTheme = await Theme.findById(theme_id, 'name layout flush books')
      let num = 3
      switch(thisTheme.layout){
        case 1:
          num = 4
          break
        case 2:
          num = 3
          break
        case 3:
          num = 3
          break
        case 4:
          num = 6
          break
        default:
          break
      }
      let bookList = []
      for(let i=0; i<thisTheme.books.length; i++){
        if((i > num*(page -1)) && (i <= num*page)){
          let tmpBook = await Book.findById(thisTheme.books[i].bookid)
          if(tmpBook){
            bookList.push(tmpBook)
          }
        }
      }
      ctx.body = { ok: true, msg: '获取栏目成功', list: bookList }
    }else{
      ctx.body = { ok: false, msg: '缺少参数theme_id'}
    }
  })

  router.post('/api/theme', async (ctx, next) => {
    let { priority, name, des, books, show, layout, flush } = ctx.request.body
    if(books){
      books = books.split('|')
      books = books.map((item, index) => {
        item = {
          bookid: item,
          index: index
        }
        return item
      })
    }else{
      books = []
    }
    let theme = new Theme({
      priority: priority,
      name: name,
      des: des,
      books: books,
      show: show,
      layout: layout,
      flush: flush,
      create_time: new Date()
    })
    ctx.body = await Theme.add(ctx, theme)
  })

  router.get('/api/theme/list_book', async (ctx, next) => {
    let id = ctx.request.query.id
    let result = await Theme.findById(id)
    if(result){
      let list = []
      for(let i=0; i<result.books.length; i++){
        let tmpBook = await Book.findById(result.books[i])
        if(tmpBook){
          list.push(tmpBook)
        }
      }
      ctx.body = { ok: true, msg: '列出书籍成功', list: list}
    }else{
      ctx.body = { ok: false, msg: '列出书籍失败，栏目对应的id不存在' }
    }
  })

  router.post('/api/theme/add_book', async (ctx, next) => {
    let { id, books } = ctx.request.body
    let thisTheme = await Theme.findById(id)
    let allbooks = []
    thisTheme.books.forEach(item => {
      allbooks.push(item.bookid)
    })
    allbooks = allbooks.concat(books ? books.split('|') : [])
    // let set = new Set(allbooks)
    // allbooks = Array.from(set)
    allbooks = unique(allbooks)
    allbooks = allbooks.map((item, index) => {
      item = {
        bookid: item,
        index: index
      }
      return item
    })
    let result = await Theme.update({_id: id}, { '$addToSet': { 'books': { '$each': allbooks }}})
    if (result.ok === 1) {
      ctx.body = { ok: true, msg: '栏目添加书籍成功' }
    } else {
      ctx.body = { ok: false, msg: '栏目添加书籍失败', data: result }
    }
  })
}
