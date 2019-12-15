import { BookList, Book, User } from '../models'
import { checkUserToken } from '../utils'

export default function(router) {
  router.get('/api/booklist/remove_book', async (ctx, next) => {
    const userid = await checkUserToken(ctx, next)
    if (userid) {
      const id = ctx.request.query.id
      if (id) {
        const updateResult = await BookList.update({ userid: userid }, { $pull: { 'books': { bookid: id } } })
        if (updateResult.ok === 1) {
          ctx.body = { ok: true, msg: '删除书籍成功' }
        } else {
          ctx.body = { ok: false, msg: '删除书籍失败' }
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
        if (hisBookList) {
          for (let i = 0; i < hisBookList.books.length; i++) {
            if (hisBookList.books[i].bookid.toString() == id) {
              isExisted = true
            }
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
                  bookid: await BookList.transId(id),
                  rss: 0,
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

  // 订阅书籍
  router.post('/api/booklist/rss', async (ctx, next) => {
    let userid = await checkUserToken(ctx, next)
    if (userid) {
      let { bookid, rss } = ctx.request.body
      rss = !!rss ? 1 : 0
      let thisBook = await Book.findById(bookid, '_id')
      if (!thisBook) {
        ctx.body = { ok: false, msg: '找不到此书籍' }
        return false
      }
      let updateResult = await BookList.update({ userid: userid, 'books.bookid': bookid }, { $set: { 'books.$.rss': rss } })
      if (updateResult.ok === 1) {
        ctx.body = { ok: true, msg: '修改书籍订阅状态成功' }
      } else {
        ctx.body = { ok: false, msg: '修改书籍订阅状态失败' }
      }
    }
  })

  // 更新用户阅读进度接口
  router.post('/api/booklist/update_read', async (ctx, next) => {
    let userid = await checkUserToken(ctx, next)
    if (userid) {
      let { bookid, chapter_num, chapter_page_index, chapter_page_top, read_time, setting } = ctx.request.body
      // 校验参数合法性
      if (!(bookid && chapter_num && (chapter_page_index || chapter_page_index == 0) && (chapter_page_top || chapter_page_top == 0))) {
        ctx.body = { ok: false, msg: '参数错误' }
        return false
      }
      // 校验booklist
      let thisBookList = await BookList.findOne({ userid })
      if (!thisBookList) {
        ctx.body = { ok: false, msg: '找不到对应的BookList' }
        return false
      }
      // 开始更新
      let updateResult = await BookList.update(
        {
          userid,
          'books.bookid': bookid
        },
        {
          $set: {
            'books.$.read': {
              num: chapter_num,
              top: chapter_page_index || 0,
              scroll: chapter_page_top || 0
            },
            'books.$.time': new Date()
          }
        }
      )
      let updateReadTime = await User.update({ _id: userid }, { $inc: { read_time: parseInt(read_time) }})
      if (updateResult.ok === 1 && updateReadTime.ok === 1) {
        if (updateResult.nModified === 1) {
          ctx.body = { ok: true, msg: '更新阅读进度成功，最新进度第' + chapter_num + '章，第' + chapter_page_index + '页' }
        } else {
          ctx.body = { ok: true, msg: '阅读进度没有改动' }
        }
      } else {
        ctx.body = { ok: false, msg: '更新阅读进度失败' }
      }
    }
  })

  router.get('/api/booklist/mylist', async (ctx, next) => {
    const userid = await checkUserToken(ctx, next)
    if (userid) {
      const thisBookList = await BookList.findOne({ userid })
        .populate({
          path: 'books.bookid',
          options: {
            select: 'name img_url update_status update_time newest_chapter',
          }
        })
      if (!thisBookList) {
        ctx.body = { ok: true, msg: '获取书单信息成功', list: [] }
        return false
      }
      const result = thisBookList.books.map(item => {
        let sign = ''
        if (item.read.num < item.bookid.newest_chapter) {
          sign = 'update'
        } else if (item.read.num === item.bookid.newest_chapter && item.bookid.update_status === '已完结') {
          sign = 'over'
        }
        return {
          bookid: item.bookid._id,
          read_num: item.read.num,
          read_top: item.read.top,
          read_scroll: item.read.scroll || 0,
          rss: item.rss,
          time: item.time,
          name: item.bookid.name,
          img_url: item.bookid.img_url,
          sign,
        }
      })
      // 根据time排序 
      result.sort((book1, book2) => {
        if (book2.time instanceof Date && book1.time instanceof Date) {
          return book2.time.getTime() - book1.time.getTime()
        } else {
          return new Date(book2.time).getTime() - new Date(book1.time).getTime()
        }
      })
      ctx.body = { ok: true, msg: '获取书单信息成功', list: result }
    }
  })
}
