import { Theme, Book, BookList } from '../models'
import { tool, checkAdminToken } from '../utils'

export default function(router) {
  /**
   * 前端接口
   * 首页获取栏目数据的接口
   */
  router.get('/api/front/theme', async (ctx, next) => {
    // 查找出所有的需要显示的栏目
    let allThemes = await Theme.find({ show: true }, 'name layout flush books').sort({ priority: 1 })
    let result = []
    for (let i = 0; i < allThemes.length; i++) {
      let bookList = []
      let num = 3
      switch (allThemes[i].layout) {
        case 1:
          num = 4
          break
        case 2:
          num = 5
          break
        case 3:
          num = 6
          break
        default:
          break
      }
      for (let k = 0; k < allThemes[i].books.length; k++) {
        if (k >= num) {
          break
        } else {
          let tmpBook = await Book.findById(allThemes[i].books[k].bookid, 'name img_url des author classification')
          tmpBook.des = tmpBook.des
            .replace(/\s/g, '')
            .replace(/\n/g, '')
            .replace(/\r/g, '')
          if (tmpBook) {
            bookList.push({
              _id: tmpBook._id,
              name: tmpBook.name,
              author: tmpBook.author,
              img_url: tmpBook.img_url,
              classify: tmpBook.classification,
              des: tmpBook.des
            })
          }
        }
      }
      result.push({
        _id: allThemes[i]._id,
        name: allThemes[i].name,
        layout: allThemes[i].layout,
        flush: allThemes[i].flush,
        books: bookList
      })
    }
    ctx.body = { ok: true, msg: '获取栏目成功', list: result }
  })

  /**
   * 前端接口
   * 首页点击换一批对应的接口
   */
  router.get('/api/front/theme/flush', async (ctx, next) => {
    let { page, theme_id } = ctx.request.query
    if (page) {
      page = parseInt(page)
      if (page < 2) {
        page = 2
      }
    } else {
      page = 2
    }
    if (theme_id) {
      // 查找出所有的需要显示的栏目
      let result = []

      let thisTheme = await Theme.findById(theme_id, 'name layout flush books')
      let num = 3
      switch (thisTheme.layout) {
        case 1:
          num = 4
          break
        case 2:
          num = 5
          break
        case 3:
          num = 5
          break
        default:
          break
      }
      let bookList = []
      for (let i = 0; i < thisTheme.books.length; i++) {
        if (i > num * (page - 1) && i <= num * page) {
          let tmpBook = await Book.findById(thisTheme.books[i].bookid, 'name img_url des author classification')
          if (tmpBook) {
            bookList.push(tmpBook)
          }
        }
      }
      ctx.body = { ok: true, msg: '获取更多书籍成功', list: bookList }
    } else {
      ctx.body = { ok: false, msg: '获取更多书籍失败，参数错误' }
    }
  })

  /**
   * 后台接口
   * 列出所有的主题
   */
  router.get('/api/backend/theme', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'theme_list')
    if (userid) {
      let allThemes = await Theme.find({}, { books: 0 }).sort({ priority: 1 })
      if (allThemes) {
        ctx.body = { ok: true, msg: '获取主题列表成功', list: allThemes }
      } else {
        ctx.body = { ok: false, msg: '获取主题列表失败' }
      }
    }
  })

  /**
   * 后台接口
   * 新增主题
   */
  router.post('/api/backend/theme', async (ctx, next) => {
    let { name, des, books, show, layout, flush } = ctx.request.body
    let finalBooks = []
    if (books) {
      books = books.split('|')
      let count = 0
      for (let i = 0; i < books.length; i++) {
        let thisBook = await Book.findById(books[i])
        if (thisBook) {
          finalBooks.push({
            bookid: thisBook.id,
            index: count
          })
          count++
        }
      }
    } else {
      books = []
    }
    let maxPriority = await Theme.count()
    let theme = await Theme.create({
      priority: maxPriority + 1,
      name: name,
      des: des,
      books: finalBooks,
      show: show,
      layout: layout,
      flush: flush,
      create_time: new Date()
    })
    ctx.body = { ok: true, msg: '创建主题成功', data: theme }
  })

  /**
   * 后台接口
   * 获取主题详细信息
   */
  router.get('/api/backend/theme/:id', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'theme_list')
    if (userid) {
      let id = ctx.params.id
      let thisTheme = await Theme.findById(id).populate({
        path: 'books.bookid',
        select: { chapters: 0 }
      })
      // 获取书籍详情
      if (thisTheme) {
        ctx.body = { ok: true, msg: '获取主题详情成功', data: thisTheme }
      } else {
        ctx.body = { ok: false, msg: '获取主题详情失败' }
      }
    }
  })

  

  /**
   * 后台接口
   * 修改主题
   */
  router.patch('/api/backend/theme/:id', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'theme_update')
    if (userid) {
      let id = ctx.params.id
      let result = await Theme.update(
        { _id: id },
        {
          $set: ctx.request.body
        }
      )
      if (result.ok === 1) {
        let newest = await Theme.findById(id)
        ctx.body = { ok: true, msg: '更新成功', data: newest }
      } else {
        ctx.body = { ok: false, msg: '更新失败', data: result }
      }
    }
  })

  /**
   * 后台接口
   * 删除主题
   */
  router.delete('/api/backend/theme/:id', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'theme_delete')
    if (userid) {
      let id = ctx.params.id
      let result = await Theme.remove({ _id: id })
      if (result.result.ok === 1) {
        ctx.body = { ok: true, msg: '删除成功' }
      } else {
        ctx.body = { ok: false, msg: '删除失败', data: result.result }
      }
    }
  })

  /**
   * 后台接口
   * 主题拖拽排序
   */
  router.post('/api/backend/theme/exchange', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'theme_update')
    if (userid) {
      let from_index = ctx.request.body.from_index
      let to_index = ctx.request.body.to_index
      if (from_index && to_index) {
        from_index++
        to_index++
        if (from_index !== to_index) {
          let thisTheme = await Theme.findOne({ priority: from_index }, 'id priority')
          if (from_index > to_index) {
            let needChangeTheme = await Theme.find({ priority: { $lt: from_index, $gte: to_index } }, 'id priority')
            if (thisTheme && needChangeTheme.length > 0) {
              await Theme.update({ _id: thisTheme._id }, { $set: { priority: to_index } })
              for (let i = 0; i < needChangeTheme.length; i++) {
                await Theme.update({ _id: needChangeTheme[i]._id }, { $set: { priority: needChangeTheme[i].priority + 1 } })
              }
              ctx.body = { ok: true, msg: '交换成功' }
            } else {
              ctx.body = { ok: false, msg: '参数错误' }
            }
          } else {
            let needChangeTheme = await Theme.find({ priority: { $gt: from_index, $lte: to_index } }, 'id priority')
            if (thisTheme && needChangeTheme.length > 0) {
              await Theme.update({ _id: thisTheme._id }, { $set: { priority: to_index } })
              for (let i = 0; i < needChangeTheme.length; i++) {
                await Theme.update({ _id: needChangeTheme[i]._id }, { $set: { priority: needChangeTheme[i].priority - 1 } })
              }
              ctx.body = { ok: true, msg: '交换成功' }
            } else {
              ctx.body = { ok: false, msg: '参数错误' }
            }
          }
        } else {
          ctx.body = { ok: false, msg: '交换顺序不能相同' }
        }
      } else {
        ctx.body = { ok: false, msg: '参数错误' }
      }
    }
  })

  /**
   * 后台接口
   * 主题书籍排序
   */
  router.post('/api/backend/theme/:id/book_exchange', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'theme_update')
    if (userid) {
      let themeId = ctx.params.id
      let from_index = ctx.request.body.from_index
      let to_index = ctx.request.body.to_index
      if (from_index && to_index) {
        from_index = parseInt(from_index)
        to_index = parseInt(to_index)
        let thisTheme = await Theme.findById(themeId)
        let newBooks = thisTheme.books.sort((item1, item2) => {
          return parseInt(item1.index) - parseInt(item2.index)
        })
        if (from_index !== to_index) {
          if (from_index > to_index) {
            newBooks[from_index].index = newBooks[to_index].index
            for (let i = to_index; i < from_index; i++) {
              newBooks[i].index = newBooks[i].index + 1
            }
          } else {
            newBooks[from_index].index = newBooks[to_index].index
            for (let i = from_index + 1; i <= to_index; i++) {
              newBooks[i].index = newBooks[i].index - 1
            }
          }
          let updateResqust = await Theme.update({ _id: themeId }, { $set: { books: newBooks } })
          if (updateResqust.ok === 1) {
            ctx.body = { ok: true, msg: '交换成功' }
          } else {
            ctx.body = { ok: false, msg: '交换失败' }
          }
        } else {
          ctx.body = { ok: false, msg: '交换顺序不能相同' }
        }
      } else {
        ctx.body = { ok: false, msg: '参数错误' }
      }
    }
  })

  /**
   * 后台接口
   * 列出主题下的所有书籍
   */
  router.get('/api/backend/theme/allbooks', async (ctx, next) => {
    let id = ctx.request.query.id
    let result = await Theme.findById(id)
    if (result) {
      let list = []
      result.books.sort((book1, book2) => {
        return parseInt(book1.index) - parseInt(book2.index)
      })
      for (let i = 0; i < result.books.length; i++) {
        let tmpBook = await Book.findById(result.books[i].bookid)
        if (tmpBook) {
          list.push(tmpBook)
        }
      }
      ctx.body = { ok: true, msg: '列出书籍成功', list: list }
    } else {
      ctx.body = { ok: false, msg: '列出书籍失败，栏目对应的id不存在' }
    }
  })

  /**
   * 后台接口
   * 更新主题中的书籍列表
   */
  router.put('/api/backend/theme/:id/updatebooks', async (ctx, next) => {
    const id = ctx.params.id
    const { books } = ctx.request.body
    if (!id) {
      ctx.body = { ok: false, msg: '更新主题失败，缺乏id参数' }
      return
    }

    const thisTheme = await Theme.findById(id)
    if (!thisTheme) {
      ctx.body = { ok: false, msg: '更新主题失败，找不到这样的主题' }
      return
    }
    const allbooks = books ? books.split('|') : []
    // thisTheme.books.forEach(item => {
    //   allbooks.push(typeof item.bookid === 'string' ? item.bookid : item.bookid.toString())
    // })
    // allbooks = allbooks.concat(books ? books.split('|') : [])
    // allbooks = tool.unique(allbooks)
    let finalBooks = []
    let count = 1
    for (let i = 0; i < allbooks.length; i++) {
      let thisBook = await Book.findById(allbooks[i])
      if (thisBook) {
        finalBooks.push({
          bookid: await Theme.transId(allbooks[i]),
          index: count
        })
        count++
      }
    }
    let result = await Theme.update({ _id: id }, { $set: { books: finalBooks } })
    if (result.ok === 1) {
      ctx.body = { ok: true, msg: '更新主题书籍成功' }
    } else {
      ctx.body = { ok: false, msg: '更新主题书籍失败', data: result }
    }
  })
}
