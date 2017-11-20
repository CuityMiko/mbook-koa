import { Theme, Book } from '../models'
import { tool } from '../utils/index'

export default function (router) {
  // 首页获取栏目数据的接口
  router.get('/api/theme/index_list', async (ctx, next) => {
    // 查找出所有的需要显示的栏目
    let allThemes = await Theme.find({ show: true }, 'name layout flush books').sort({priority: -1})
    let result = []
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
      result.push({
        '_id': allThemes[i]._id,
        'name': allThemes[i].name,
        'layout': allThemes[i].layout,
        'flush': allThemes[i].flush,
        'books': bookList
      })
    }
    ctx.body = { ok: true, msg: '获取栏目成功', list: result }
  })

  // 点击换一批对应的接口
  router.get('/api/theme/change_list', async (ctx, next) => {
    let { page, theme_id } = ctx.request.query
    if(page){
      page = parseInt(page)
      if(page < 2){
        page = 2
      }
    }else{
      page = 2
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
    let finalBooks = []
    if(books){
      books = books.split('|')
      let count = 0
      for(let i=0; i<books.length; i++){
        let thisBook = await Book.findById(books[i])
        if(thisBook){
          finalBooks.push({
            bookid: thisBook.id,
            index: count
          })
          count ++
        }
      }
    }else{
      books = []
    }
    let theme = await Theme.create({
      priority: priority,
      name: name,
      des: des,
      books: finalBooks,
      show: show,
      layout: layout,
      flush: flush,
      create_time: new Date()
    })
    ctx.body = { ok: true, msg: '创建主题成功！', data: theme }
  })

  router.get('/api/theme/list_book', async (ctx, next) => {
    let id = ctx.request.query.id
    let result = await Theme.findById(id)
    if(result){
      let list = []
      result.books.sort((book1, book2) => {
        return parseInt(book1.index) - parseInt(book2.index)
      })
      for(let i=0; i<result.books.length; i++){
        let tmpBook = await Book.findById(result.books[i].bookid)
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
    if(id){
      let thisTheme = await Theme.findById(id)
      let allbooks = []
      thisTheme.books.forEach(item => {
        allbooks.push(item.bookid.toString())
      })
      allbooks = allbooks.concat(books ? books.split('|') : [])
      // let set = new Set(allbooks)
      // allbooks = Array.from(set)
      allbooks = tool.unique(allbooks)
      let finalBooks = []
      for(let i=0; i<allbooks.length; i++){
        finalBooks.push({
          bookid: await Theme.transId(allbooks[i]),
          index: i
        })
      }
      let result = await Theme.update({_id: id}, { '$set': { 'books': finalBooks}})
      if (result.ok === 1) {
        ctx.body = { ok: true, msg: '栏目添加书籍成功' }
      } else {
        ctx.body = { ok: false, msg: '栏目添加书籍失败', data: result }
      }
    }else{
      ctx.body = { ok: false, msg: '缺乏id参数' }
    }
  })
}
