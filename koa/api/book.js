import { Book, BookList } from '../models'
import { jwtVerify, tool } from '../utils'

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
    if (index) {
      index = parseInt(index)
      let chineseName = '其他类别'
      switch(index){
        case 1:
          chineseName = '玄幻·奇幻'
          break
        case 2:
          chineseName = '修真·仙侠'
          break
        case 3:
          chineseName = '都市·青春'
          break
        case 4:
          chineseName = '历史·军事'
          break
        case 5:
          chineseName = '网游·竞技'
          break
        case 6:
          chineseName = '科幻·灵异'
          break
        case 7:
          chineseName = '言情·穿越'
          break
        case 8:
          chineseName = '耽美·同人'
          break
        case 9:
          chineseName = '侦探·推理'
          break
        default:
          break
      }
      let books = await Book.find({classification: chineseName}, '_id name img_url author des').sort({classify_order: 1, hot_value: -1})
      if (books) {
        ctx.body = { ok: true, msg: '获取书籍详情成功', list: books}
      } else {
        ctx.body = { ok: true, msg: '获取分类成功', list: [] }
      }
    } else {
      ctx.body = { ok: false, msg: '缺少index参数' }
    }
  })
}
