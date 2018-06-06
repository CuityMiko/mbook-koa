import { BookList, Book, User } from '../models'
import { checkUserToken, tool } from '../utils'

export default function(router) {
  router.get('/api/booklist/remove_book', async (ctx, next) => {
    let userid = await checkUserToken(ctx, next)
    if (userid) {
      let id = ctx.request.query.id
      if (id) {
        let hisBookList = await BookList.findOne({ userid })
        let newBookList = []
        let count = 0
        for (let i = 0; i < hisBookList.books.length; i++) {
          if (hisBookList.books[i].bookid.toString() !== id) {
            newBookList.push({
              bookid: hisBookList.books[i].bookid,
              index: count,
              time: hisBookList.books[i].time,
              read: { num: hisBookList.books[i].read.num, top: hisBookList.books[i].read.top }
            })
            count++
          }
        }
        if (newBookList.length === hisBookList.books.length) {
          ctx.body = { ok: false, msg: '书籍不在书架中' }
        } else if (newBookList.length < hisBookList.books.length) {
          let updateResult = await BookList.update({ userid }, { $set: { books: newBookList } })
          if (updateResult.ok === 1) {
            ctx.body = { ok: true, msg: '删除书籍成功' }
          } else {
            ctx.body = { ok: false, msg: '删除书籍失败' }
          }
        }
      } else {
        ctx.body = { ok: false, msg: '缺少id参数' }
      }
    }
  })

  router.get('/api/booklist/add_book', async (ctx, next) => {
    let userid = await checkUserToken(ctx, next)
    if (userid) {
      let id = ctx.request.query.id
      if (id) {
        let hisBookList = await BookList.findOne({ userid })
        let bookids = []
        let isExisted = false
        for (let i = 0; i < hisBookList.books.length; i++) {
          if (hisBookList.books[i].bookid.toString() == id) {
            isExisted = true
          }
        }
        if (isExisted) {
          ctx.body = { ok: false, msg: '书籍已经在书架中' }
        } else {
          let updateResult = await BookList.update(
            { userid },
            {
              $addToSet: {
                books: {
                  index: hisBookList.books.length,
                  bookid: await BookList.transId(id),
                  time: new Date(),
                  read: { num: 1, top: 0 }
                }
              }
            }
          )
          if (updateResult.ok === 1) {
            ctx.body = { ok: true, msg: '添加书籍到书架成功' }
          } else {
            ctx.body = { ok: false, msg: '添加书籍到书架失败' }
          }
        }
      } else {
        ctx.body = { ok: false, msg: '缺少id参数' }
      }
    }
  })

  // 更新用户阅读进度接口
  router.post('/api/booklist/update_read', async (ctx, next) => {
    let userid = await checkUserToken(ctx, next)
    if (userid) {
      let { bookid, chapter_num, chapter_page_index, read_time, setting } = ctx.request.body
      if (bookid && chapter_num && (chapter_page_index || chapter_page_index == 0) && setting.reader) {
        let thisBookList = await BookList.findOne({ userid })
        let newBooks = thisBookList.books.map(item => {
          if (item.bookid.toString() == bookid) {
            item.read = {
              num: chapter_num,
              top: chapter_page_index
            }
            item.time = new Date()
            return item
          } else {
            return item
          }
        })
        let updateResult = await BookList.update({ userid }, { $set: { books: newBooks } })
        let updateReadTime = await User.update({ _id: userid }, { $inc: { read_time: parseInt(read_time) }, $set: { 'setting.reader': setting.reader } })
        if (updateResult.ok === 1 && updateReadTime.ok === 1) {
          if (updateResult.nModified === 1) {
            ctx.body = { ok: true, msg: '更新阅读进度成功，最新进度第' + chapter_num + '章，第' + chapter_page_index + '页' }
          } else {
            ctx.body = { ok: true, msg: '阅读进度没有改动' }
          }
        } else {
          ctx.body = { ok: false, msg: '更新阅读进度失败' }
        }
      } else {
        ctx.body = { ok: false, msg: '更新阅读进度失败，参数错误' }
      }
    }
  })

  router.get('/api/booklist/mylist', async (ctx, next) => {
    let userid = await checkUserToken(ctx, next)
    if (userid) {
      let thisBookList = await BookList.findOne({ userid }).populate({
        path: 'books',
        options: {
          sort: {
            time: 1
          }
        }
      })
      let newThisBook = []
      // 获取书籍详情
      for (let i = 0; i < thisBookList.books.length; i++) {
        let bookInfo = await Book.findById(thisBookList.books[i].bookid, 'name img_url author')
        if (bookInfo) {
          newThisBook.push({
            bookid: thisBookList.books[i].bookid,
            index: thisBookList.books[i].index,
            read_num: thisBookList.books[i].read.num,
            read_top: thisBookList.books[i].read.top,
            time: thisBookList.books[i].time,
            name: bookInfo.name,
            author: bookInfo.author,
            img_url: bookInfo.img_url
          })
        }
      }
      // 手动排序
      newThisBook.sort((book1, book2) => {
        if (book2.time instanceOf Date && book1.time instanceOf Date) {
          return book2.time.getTime() - book1.time.getTime()
        } else {
          return (new Date(book2.time)).getTime() - (new Date(book1.time)).getTime() 
        }
      })
      if (thisBookList) {
        ctx.body = { ok: true, msg: '获取书单信息成功', list: newThisBook }
      } else {
        ctx.body = { ok: false, msg: '获取书单信息失败' }
      }
    }
  })
}
