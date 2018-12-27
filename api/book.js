import { Book, BookList, Good, Setting, Theme, Secret, Comment } from '../models'
import { checkAdminToken, checkUserToken, tool } from '../utils'
import shortid from 'shortid'

export default function(router) {
  /**
   * 小程序端获取书籍详情
   * @method get
   */
  router.get('/api/book/get_detail', async (ctx, next) => {
    // 解析jwt，取出userid查询booklist表，判断是否已经加入了书架
    let userid = await checkUserToken(ctx, next)
    if (userid) {
      let result = null
      let id = ctx.request.query.id
      if (id) {
        let book = await Book.findById(id)
        if (book) {
          let isInList = await BookList.findOne({ userid, 'books.bookid': id }, '_id')
          let hasRssTheBook = await BookList.findOne({ userid, 'books.bookid': id, 'books.rss': 1 }, '_id')
          // 获取书籍的商品属性
          let good = {}
          let thisGood = await Good.findOne({ bookid: book._id })
          if (thisGood) {
            if (thisGood.type === 4) {
              good.type = 'free'
            } else if (thisGood.type === 2) {
              good.type = 'limit_date'
              good.limit_start_time = tool.formatTime(thisGood.limit_start_time)
              good.limit_end_time = tool.formatTime(thisGood.limit_end_time)
              good.prise = thisGood.prise
            } else if (thisGood.type === 3) {
              good.type = 'limit_chapter'
              good.limit_chapter = thisGood.limit_chapter
              good.prise = thisGood.prise
            } else if (thisGood.type === 1) {
              good.type = 'normal'
              good.prise = thisGood.prise
            } else {
              good.type = 'free'
            }
          } else {
            // 非商品默认免费
            good.type = 'free'
          }
          // 用户是否已经解锁过该书籍
          // 首先检测是否解锁书籍
          const hasUnLock = await Secret.findOne({ userid, bookid: id, active: true })
          // 格式化时间
          result = {
            _id: book._id,
            name: book.name,
            img_url: book.img_url,
            author: book.author,
            des: book.des
              .replace(/\n/g, '')
              .replace(/\r/g, '')
              .replace(/\s/g, ''),
            classification: book.classification,
            update_status: book.update_status === '已完结' ? '已完结' : '第' + book.newest_chapter + '章', // 这里日后最好加上章节名
            newest_chapter: book.newest_chapter,
            rss: hasRssTheBook ? 1 : 0,
            total_words: book.total_words,
            hot_value: book.hot_value,
            update_time: tool.formatTime(book.update_time),
            good,
            hasUnLock: !!hasUnLock
          }
          ctx.body = { ok: true, msg: '获取书籍详情成功', data: result, isInList: !!isInList }
        } else {
          ctx.body = { ok: false, msg: '获取书籍详情失败' }
        }
      } else {
        ctx.body = { ok: false, msg: '缺少id参数' }
      }
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
      switch (index) {
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
      let books = await Book.find({ classification: chineseName }, '_id name img_url author des')
        .sort({ classify_order: 1, hot_value: -1 })
        .skip((page - 1) * 8)
        .limit(8)
      let total = await Book.count({ classification: chineseName })
      if (books) {
        ctx.body = { ok: true, msg: '获取书籍详情成功', total: total, list: books }
      } else {
        ctx.body = { ok: true, msg: '获取分类成功', list: [] }
      }
    } else {
      ctx.body = { ok: false, msg: '缺少参数' }
    }
  })

  // 小程序搜索书籍接口
  router.post('/api/book/search', async (ctx, next) => {
    const keyword = ctx.request.body.keyword.toString('utf8').trim()
    let page = ctx.request.body.page
    let limit = ctx.request.body.limit
    // 格式化page和limit
    if (page) {
      page = parseInt(page)
      if (page < 1) {
        page = 1
      }
    } else {
      page = 1
    }
    if (limit) {
      limit = parseInt(limit)
    } else {
      limit = 10
    }
    if (keyword) {
      const reg = new RegExp(keyword, 'i')
      const result = await Book.find(
        {
          $or: [{ name: reg }, { author: reg }]
        },
        '_id name author img_url des classification'
      ).sort({ hot_value: -1, create_time: -1 })
      let classification = []
      result.forEach(item => {
        if (classification.indexOf(item.classification) < 0) {
          classification.push(item.classification)
        }
      })
      ctx.body = { ok: true, msg: '搜索成功', list: result, classification }
    } else {
      ctx.body = { ok: false, msg: '请输入正确的搜索关键字' }
    }
  })

  // 小程序获取热门搜索选项
  router.get('/api/book/search_hot', async (ctx, next) => {
    const hotSetting = await Setting.getSetting('hot_search')
    const defaultKeyword = (await Setting.getSetting('default_keyword')) || ''
    let result = []
    if (hotSetting) {
      result = hotSetting.split('|')
    }
    ctx.body = { ok: true, msg: '获取热门搜索成功', list: result, default: defaultKeyword }
  })

  // 小程序获取搜索提示接口
  router.post('/api/book/search_help', async (ctx, next) => {
    const keyword = ctx.request.body.keyword.toString('utf8').trim()
    if (keyword) {
      const reg = new RegExp(keyword, 'i')
      const result = await Book.find(
        {
          $or: [{ name: reg }, { author: reg }]
        },
        'name author'
      ).sort({ hot_value: -1, create_time: -1 })
      let nameArr = []
      let authorArr = []
      result.forEach(item => {
        if (item.name.match(reg)) {
          nameArr.push(item.name)
        }
        if (item.author.match(reg)) {
          authorArr.push(item.author)
        }
      })
      ctx.body = { ok: true, msg: '获取搜索提示成功', list: nameArr.concat(authorArr) }
    } else {
      ctx.body = { ok: false, msg: '请输入正确的搜索关键字' }
    }
  })

  // 后台获取所有书籍的列表
  router.get('/api/book/all', async (ctx, next) => {
    const userid = await checkAdminToken(ctx, next, 'theme_update')
    if (userid) {
      let allBooks = await Book.find({}, 'id name author')
      ctx.body = { ok: true, list: allBooks, msg: '获取书籍列表成功' }
    }
  })

  // 后台获取所有不在商品中的书籍
  router.get('/api/book/sign_good', async (ctx, next) => {
    const userid = await checkAdminToken(ctx, next, 'theme_update')
    if (userid) {
      const allBooks = await Book.find({}, 'id name author')
      const allGoods = await Good.find({}, 'bookid')
      const result = []
      allBooks.forEach(item => {
        result.push({
          _id: item._id,
          name: item.name,
          author: item.author,
          is_good: allGoods.some(item2 => {
            return item2.bookid.toString() === item._id.toString()
          })
        })
      })
      ctx.body = { ok: true, list: result, msg: '获取书籍列表成功' }
    }
  })

  // 后台获取所有不在商品中的书籍
  router.get('/api/book/sign_good', async (ctx, next) => {
    const userid = await checkAdminToken(ctx, next, 'theme_update')
    if (userid) {
      const allBooks = await Book.find({}, 'id name author')
      const allGoods = await Good.find({}, 'bookid')
      const result = []
      allBooks.forEach(item => {
        result.push({
          _id: item._id,
          name: item.name,
          author: item.author,
          is_good: allGoods.some(item2 => {
            return item2.bookid.toString() === item._id.toString()
          })
        })
      })
      ctx.body = { ok: true, list: result, msg: '获取书籍列表成功' }
    }
  })

  // 后台书籍管理
  router.get('/api/book', async (ctx, next) => {
    // check if the user has permission
    const userid = await checkAdminToken(ctx, next, 'theme_update')
    if (userid) {
      let { page, limit, name, author, status } = ctx.request.query
      // format page and limit
      if (page) {
        page = parseInt(page)
      } else {
        page = 1
      }
      if (limit) {
        limit = parseInt(limit)
      } else {
        limit = 10
      }
      let condition = {}
      if (name) {
        condition.name = new RegExp(name, 'i')
      }
      if (author) {
        condition.author = new RegExp(author, 'i')
      }
      if (parseInt(status) === 1) {
        condition.update_status = '连载中'
      }
      console.log(condition)
      const total = await Book.count(condition)
      // query book
      let books = await Book.find(condition)
        .sort({ update_time: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
      ctx.body = { ok: true, total, list: books, msg: '获取书籍列表成功' }
    }
  })

  // 后台书籍管理--添加书籍
  router.post('/api/book', async (ctx, next) => {
    // check if the user has permission
    let userid = await checkAdminToken(ctx, next, 'theme_update')
    if (userid) {
      let { name, img_url, author, des, classification, classify_order, update_status, newest_chapter, total_words, hot_value } = ctx.request.body
      // format page and limit
      if (classify_order) {
        classify_order = parseInt(classify_order)
      } else {
        classify_order = 1
      }
      if (hot_value) {
        hot_value = parseInt(hot_value)
      } else {
        hot_value = 0
      }
      if (newest_chapter) {
        newest_chapter = parseInt(newest_chapter)
      } else {
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
        secret: shortid.generate(),
        update_time: new Date(),
        create_time: new Date()
      })
      if (book) {
        ctx.body = { ok: true, data: book, msg: '添加书籍成功' }
      } else {
        ctx.body = { ok: false, data: data, msg: '添加书籍失败' }
      }
    }
  })

  // 后台书籍列表更新
  router.patch('/api/book/:id', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'theme_update')
    if (userid) {
      let { name, img_url, author, des, classification, classify_order, update_status, newest_chapter, total_words, hot_value } = ctx.request.body
      let id = ctx.params.id
      let result = await Book.update(
        { _id: id },
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
        }
      )
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
      if (thisBook) {
        // 清除对应的章节
        thisBook.chapters.forEach(async item => {
          await Chapter.remove({ _id: item.toString() })
        })
        // 清除对应的商品
        await Good.remove({ bookid: thisBook.id })
        // 清除书籍对应的评论
        await Comment.remove({ bookid: thisBook.id })
        // 清除书籍对应的秘钥
        await Secret.remove({ bookid: thisBook.id })
        // 从主题中删除对应的书籍
        let allTheme = await Theme.find({}, 'books').populate({
          path: 'books',
          options: {
            sort: {
              index: 1
            }
          }
        })
        allTheme.forEach(async item => {
          const isCurrentBookInTheme = item.books.some(bookItem => {
            return bookItem.bookid.toString() === thisBook.id
          })
          if (isCurrentBookInTheme) {
            let newBooks = []
            let currentIndex = 0
            item.books.forEach((bookItem, bookIndex) => {
              if (bookItem.bookid.toString() !== thisBook.id) {
                bookItem.index = currentIndex
                currentIndex++
                newBooks.push(bookItem)
              }
            })
            await Theme.update({ _id: item._id }, { $set: { books: newBooks } })
          }
        })
        // 移除书架存储的书
        let allBookList = await BookList.find({}, 'books').populate({
          path: 'books',
          options: {
            sort: {
              index: 1
            }
          }
        })
        allBookList.forEach(async item => {
          const isCurrentBookInList = item.books.some(bookItem => {
            return bookItem.bookid.toString() === thisBook.id
          })
          if (isCurrentBookInList) {
            let newBooks = []
            let currentIndex = 0
            item.books.forEach((bookItem, bookIndex) => {
              if (bookItem.bookid.toString() !== thisBook.id) {
                bookItem.index = currentIndex
                currentIndex++
                newBooks.push(bookItem)
              }
            })
            await BookList.update({ _id: item._id }, { $set: { books: newBooks } })
          }
        })
        let result = await Book.remove({ _id: id })
        if (result.result.ok === 1) {
          ctx.body = { ok: true, msg: '删除成功' }
        } else {
          ctx.body = { ok: false, msg: '删除失败', data: result.result }
        }
      } else {
        ctx.body = { ok: false, msg: '删除失败，找不到此书籍' }
      }
    }
  })
}
