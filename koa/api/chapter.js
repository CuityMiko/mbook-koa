import { Book, Chapter, BookList } from '../models'
import { jwtVerify, tool } from '../utils'

export default function (router) {
  router.post('/api/chapter/add', async(ctx, next) => {
    let { bookid, name, num, content } = ctx.request.body
    // 检查num是否重复
    let oldChapter = await Book.findById(bookid).populate({
      path: 'chapters',
      select: 'num'
    })
    let isExist = oldChapter.chapters.some(item => {
      return item.num == num
    })
    if (!isExist) {
      // 插入章节
      let thisChapter = await Chapter.create({
        name: name,
        num: num,
        content: content,
        create_time: new Date()
      })
      // 更新book表
      let thisBook = await Book.update({
        _id: bookid
      }, {
        '$addToSet': {
          chapters: thisChapter.id
        }
      })
      if (thisBook.ok == 1 && thisBook.nModified == 1) {
        ctx.body = {
          ok: true,
          msg: '新增章节成功'
        }
      } else {
        ctx.body = {
          ok: false,
          msg: '新增失败'
        }
      }
    }else{
      ctx.body = {
        ok: false,
        msg: '新增失败，章节重复'
      }
    }
  })

  router.get('/api/chapter/list', async(ctx, next) => {
    let { bookid } = ctx.request.query
    let thisBook = await Book.findById(bookid, 'id').populate({
      path: 'chapters',
      select: 'name num',
      options: {
        sort: {
          num: 1
        }
      }
    })
    if (thisBook) {
      ctx.body = { ok: true, msg: '获取章节列表成功', data: thisBook }
    } else {
      ctx.body = { ok: false, msg: '找不到对应的书籍' }
    }
  })

  router.get('/api/chapter/detail', async(ctx, next) => {
    let { bookid, chapter_id } = ctx.request.query
    let token = ctx.header.authorization.split(' ')[1]
    let payload = await jwtVerify(token)
    if(chapter_id){
      let thisChapter = await Chapter.findById(chapter_id)
      let thiBook = await Book.findById(bookid, 'newest_chapter')
      if (thisChapter._id) {
        ctx.body = {
          ok: true,
          msg: '获取章节详情成功',
          newest: thiBook.newest_chapter,
          page: 1,
          data: thisChapter
        }
      } else {
        ctx.body = { ok: false, msg: '获取章节详情失败' }
      }
    }else{
      // 去booklist里读取用户阅读进度
      let thisBookList = await BookList.findOne({userid: payload.userid})
      let readChapterNum = 1
      let readChapterPage = 1
      thisBookList.books.forEach(item => {
        if(item.bookid.toString() == bookid){
          readChapterNum = item.read.num
          readChapterPage = item.read.page
        }
      })
      console.log(readChapterNum, readChapterPage)
      let thisBook = await Book.findById(bookid, 'id newest_chapter').populate({
        path: 'chapters',
        match: {
          num: readChapterNum
        }
      })
      if (thisBook.chapters[0]) {
        ctx.body = {
          ok: true,
          msg: '获取章节详情成功',
          page: readChapterPage,
          newest: thisBook.newest_chapter,
          data: thisBook.chapters[0]
        }
      } else {
        ctx.body = { ok: false, msg: '获取章节详情失败' }
      }
    }
  })
}
