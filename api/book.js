import { Book, BookList } from '../models'
import { checkAdminToken, jwtVerify, tool } from '../utils'

export default function (router) {
  // 获取书籍详情接口
  router.get('/api/book/get_detail', async (ctx, next) => {
    let result = null
    let id = ctx.request.query.id
    if (id) {
      let book = await Book.findById(id)
      if (book) {
        // 解析jwt，取出userid查询booklist表，判断是否已经加入了书架
        let token = ctx.header.authorization.split(' ')[1]
        let payload = await jwtVerify(token)
        let hisBookList = await BookList.findOne({ userid: payload.userid })
        let isInList = hisBookList.books.some(item => {
          return item.bookid.toString() === id
        })
        // 格式化时间
        result = {
          '_id': book._id,
          'name': book.name,
          'img_url': book.img_url,
          'author': book.author,
          'des': book.des,
          'classification': book.classification,
          'update_status': book.update_status === '已完结' ? '已完结' : '第' + book.newest_chapter + '章', // 这里日后最好加上章节名
          'newest_chapter': book.newest_chapter,
          'total_words': book.total_words,
          'hot_value': book.hot_value,
          'update_time': tool.formatTime(book.update_time),
        }
        ctx.body = { ok: true, msg: '获取书籍详情成功', data: result, isInList: isInList }
      } else {
        ctx.body = { ok: false, msg: '获取书籍详情失败' }
      }
    } else {
      ctx.body = { ok: false, msg: '缺少id参数' }
    }
  })

  // 获取书籍分类列表的接口
  router.get('/api/book/classify', async (ctx, next) => {
    let index = ctx.request.query.index
    let page = ctx.request.query.page
    if (index && page) {
      index = parseInt(index)
      page = parseInt(page)
      let chineseName = '其他类别'
      switch(index){
        case 0:
          chineseName = '玄幻·奇幻'
          break
        case 1:
          chineseName = '修真·仙侠'
          break
        case 2:
          chineseName = '都市·青春'
          break
        case 3:
          chineseName = '历史·军事'
          break
        case 4:
          chineseName = '网游·竞技'
          break
        case 5:
          chineseName = '科幻·灵异'
          break
        case 6:
          chineseName = '言情·穿越'
          break
        case 7:
          chineseName = '耽美·同人'
          break
        case 8:
          chineseName = '侦探·推理'
          break
        default:
          break
      }
      let books = await Book.find({classification: chineseName}, '_id name img_url author des').sort({classify_order: 1, hot_value: -1}).skip((page-1)*8).limit(8)
      let total = await Book.count({ classification: chineseName })
      if (books) {
        ctx.body = { ok: true, msg: '获取书籍详情成功', total: total, list: books}
      } else {
        ctx.body = { ok: true, msg: '获取分类成功', list: [] }
      }
    } else {
      ctx.body = { ok: false, msg: '缺少参数' }
    }
  })

  // 后台获取所有书籍的列表
  router.get('/api/book/all', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'theme_update')
    if (userid) {
      let allBooks = await Book.find({}, 'id name author')
      ctx.body = { ok: true, list: allBooks, msg: '获取书籍列表成功'}
    }
  })

  // 后台书籍管理
  router.get('/api/book', async (ctx, next) => {
    // check if the user has permission
    let userid = await checkAdminToken(ctx, next, 'theme_update')
    if (userid) {
      let {page, limit} = ctx.request.query
      // format page and limit
      if(page){
        page = parseInt(page)
      }else{
        page = 1
      }
      if(limit){
        limit = parseInt(limit)
      }else{
        limit = 10
      }
      const total = await Book.count()
      // query book
      let books = await Book.find({}).sort({hot_value: -1}).populate({
        path: 'chapters',
        model: 'Chapter',
        select: {content: 0},
        options: {limit: 5, sort: {'num': -1}}
      }).skip((page-1)*limit).limit(limit)
      ctx.body = { ok: true, total, list: books, msg: '获取书籍列表成功'}
    }
  })

  // 后台书籍管理--添加书籍
  router.post('/api/book', async (ctx, next) => {
    // check if the user has permission
    let userid = await checkAdminToken(ctx, next, 'theme_update')
    if (userid) {
      let {name, img_url, author, des, classification, classify_order, update_status, newest_chapter, total_words, hot_value} = ctx.request.body
      // format page and limit
      if(classify_order){
        classify_order = parseInt(classify_order)
      }else{
        classify_order = 1
      }
      if(hot_value){
        hot_value = parseInt(hot_value)
      }else{
        hot_value = 0
      }
      if(newest_chapter){
        newest_chapter = parseInt(newest_chapter)
      }else{
        newest_chapter = 0
      }
      // query book
      let book = await Book.create({
        name: name,
        img_url: img_url,
        author: author,
        des: des,
        classification: classification,
        classify_order: classify_order,
        update_status: update_status,
        newest_chapter: newest_chapter,
        total_words: total_words,
        hot_value: hot_value,
        chapters: [], // empty chapter
        update_time: new Date(),
        create_time: new Date()
      })
      if(book){
        ctx.body = { ok: true, data: book, msg: '添加书籍成功'}
      }else{
        ctx.body = { ok: false, data: data, msg: '添加书籍失败'}
      }
    }
  })

  // 后台书籍列表更新
  router.patch('/api/book/:id', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'theme_update')
    if (userid) {
      let {name, img_url, author, des, classification, classify_order, update_status, newest_chapter, total_words, hot_value} = ctx.request.body
      let id = ctx.params.id
      let result = await Book.update({ _id: id },
        {
          $set: {
            name: name,
            img_url: img_url,
            author: author,
            des: des,
            classification: classification,
            classify_order: classify_order,
            update_status: update_status,
            newest_chapter: newest_chapter,
            total_words: total_words,
            hot_value: hot_value,
            update_time: new Date()
          }
        })
      if (result.ok === 1) {
        let newest = await Book.findById(id)
        ctx.body = { ok: true, msg: '更新书籍成功', data: newest }
      } else {
        ctx.body = { ok: false, msg: '更新书籍失败', data: result }
      }
    }
  })

  // 后台书籍列表删除
  router.delete('/api/book/:id', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'theme_delete')
    if (userid) {
      let id = ctx.params.id
      let thisBook = await Book.findById(id)
      if(thisBook){
        // 清除对应的章节
        thisBook.chapters.forEach(async item => {
          await Chapter.remove({_id: item.toString()})
        })
        let result = await Book.remove({ _id: id })
        if (result.result.ok === 1) {
          ctx.body = { ok: true, msg: '删除成功' }
        } else {
          ctx.body = { ok: false, msg: '删除失败', data: result.result }
        }
      }else{
        ctx.body = { ok: false, msg: '删除失败，找不到此书籍' }
      }
    }
  })
}
