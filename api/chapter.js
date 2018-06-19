import { Book, Chapter, BookList, Good, User, Buy, Secret } from '../models'
import { checkAdminToken, checkUserToken, tool } from '../utils'
import moment from 'moment'
import convert from 'koa-convert'
import body from 'koa-better-body'
import xlsx from 'node-xlsx'
// nodejs 读取大文本
import util from 'util'
import events from 'events'
import fs from 'fs'

// 创建可限制读取大小的文本流
function ReadStreamThrottle(stream, speed) {
  this._stream = stream
  this._readBytes = 0
  this._speed = speed
  this._ended = false
  this._readBytesSecond = 0
  this._lastTimestamp = Date.now()
  this._paused = false
  let self = this

  // 检查速度是否太快
  function isTooFast() {
    const t = (Date.now() - self._lastTimestamp) / 1000
    const bps = self._readBytesSecond / t
    return bps > speed
  }

  // 每隔一段时间检查速度
  function checkSpeed() {
    if (isTooFast()) {
      self.pause()
      // 直到平均速度放缓到预设的值时继续读流
      const tid = setInterval(function() {
        if (!isTooFast()) {
          clearInterval(tid)
          self.resume()
        }
      }, 100)
    } else {
      self.resume()
    }
  }

  stream.on('data', function(chunk) {
    self._readBytes += chunk.length
    self._readBytesSecond += chunk.length
    self.emit('data', chunk)
    checkSpeed()
  })

  stream.on('end', function() {
    self._ended = true
    self.emit('end')
  })
}

util.inherits(ReadStreamThrottle, events.EventEmitter)

ReadStreamThrottle.prototype.pause = function() {
  this._paused = true
  this._stream.pause()
}

ReadStreamThrottle.prototype.resume = function() {
  this._paused = false
  this._stream.resume()
}

// 打印内存占用情况
// function printMemoryUsage () {
//   var info = process.memoryUsage()
//   function mb (v) {
//     return (v / 1024 / 1024).toFixed(2) + 'MB'
//   }
//   console.log('rss=%s, heapTotal=%s, heapUsed=%s', mb(info.rss), mb(info.heapTotal), mb(info.heapUsed))
// }
// setInterval(printMemoryUsage, 1000)

export default function(router) {
  router.get('/api/chapter/list', async (ctx, next) => {
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

  router.get('/api/chapter/detail', async (ctx, next) => {
    let userid = await checkUserToken(ctx, next)
    if (userid) {
      // url参数
      let { bookid, chapter_id, chapter_num } = ctx.request.query
      // 章节号转化成数据
      chapter_num = parseInt(chapter_num)
      // 用户是否有权限查看该章节
      const canReadFunc = async function(num) {
        let canRead = false
        let doAutoBuy = false
        // 获取书籍的商品信息
        const goodInfo = await Good.findOne({ bookid })
        if (!goodInfo) {
          canRead = true
        }
        // 获取用户是否设置了自动购买
        let autoBuy = false
        const thisUser = await User.findById(userid)
        if (thisUser && thisUser.setting.autoBuy) {
          autoBuy = true
        }
        const hasBuyHistory = async function() {
          // 首先检测是否解锁书籍
          const thisSecret = await Secret.findOne({ userid, bookid, active: true })
          if (thisSecret) {
            // 用户已经解锁该书籍
            canRead = true
          } else {
            const thisBuy = await Buy.findOne({ goodid: goodInfo._id, userid, chapter: num })
            if (!thisBuy) {
              if (autoBuy) {
                // 检验余额是否充足
                if (parseInt(thisUser.amount) >= parseInt(goodInfo.prise)) {
                  const newBuy = await Buy.create({
                    goodid: await Buy.transId(goodInfo._id),
                    userid: await Buy.transId(userid),
                    amount: goodInfo.prise,
                    chapter: num,
                    des: moment().format('YYYY-MM-DD hh:mm:ss') + ' 自动购买章节 ' + num,
                    create_time: new Date()
                  })
                  // 扣除用户书币
                  const reduceResult = await User.reduceAmount(userid, parseInt(goodInfo.prise))
                  if (reduceResult) {
                    canRead = true
                    doAutoBuy = true
                  } else {
                    canRead = false
                    doAutoBuy = false
                    await Buy.remove({ _id: newBuy._id })
                  }
                } else {
                  canRead = false
                }
              } else {
                canRead = false
              }
            } else {
              canRead = true
            }
          }
        }
        if (goodInfo) {
          switch (goodInfo.type) {
            case 4: // 全书免费
              canRead = true
              break
            case 3: // 限章免费
              // 判断当前章节是否在免费章节内
              if (num <= goodInfo.limit_chapter) {
                canRead = true
              } else {
                await hasBuyHistory()
              }
              break
            case 2: // 限时免费
              // 判断当前是否在免费时间段内
              const now = new Date().getTime()
              if (now >= goodInfo.limit_start_time.getTime() && now <= goodInfo.limit_end_time.getTime()) {
                canRead = true
              } else {
                await hasBuyHistory()
              }
              break
            case 1:
              await hasBuyHistory()
              break
            default:
              canRead = false
              break
          }
          return {
            canRead,
            autoBuy,
            doAutoBuy
          }
        } else {
          return {
            canRead: true,
            autoBuy: false,
            doAutoBuy: false
          }
        }
      }
      // 判断canRead结束，开始查询本书的具体内容
      if (chapter_id) {
        // 通过传递章节id获取章节内容
        const thisChapter = await Chapter.findById(chapter_id)
        const thisBook = await Book.findById(bookid, 'name img_url author newest_chapter')
        if (thisChapter._id) {
          const canReadResult = await canReadFunc(thisChapter.num)
          ctx.body = {
            ok: true,
            canRead: canReadResult.canRead,
            autoBuy: canReadResult.autoBuy,
            doAutoBuy: canReadResult.doAutoBuy,
            msg: '获取章节详情成功',
            bookname: thisBook.name,
            headimg: thisBook.img_url,
            author: thisBook.author,
            newest: thisBook.newest_chapter,
            top: 0,
            data: thisChapter
          }
        } else {
          ctx.body = { ok: false, msg: '获取章节详情失败' }
        }
      } else if (chapter_num) {
        // 通过传递章节数获取章节内容
        let thisBook = await Book.findById(bookid, 'id name img_url author newest_chapter').populate({
          path: 'chapters',
          match: {
            num: chapter_num
          }
        })
        if (thisBook.chapters[0]) {
          const canReadResult = await canReadFunc(thisBook.chapters[0].num)
          ctx.body = {
            ok: true,
            canRead: canReadResult.canRead,
            autoBuy: canReadResult.autoBuy,
            doAutoBuy: canReadResult.doAutoBuy,
            msg: '获取章节详情成功',
            top: 0,
            bookname: thisBook.name,
            headimg: thisBook.img_url,
            author: thisBook.author,
            newest: thisBook.newest_chapter,
            data: thisBook.chapters[0]
          }
        } else {
          ctx.body = { ok: false, msg: '获取章节详情失败' }
        }
      } else {
        // 去booklist里读取用户阅读进度
        let thisBookList = await BookList.findOne({ userid })
        let readChapterNum = 1
        let readChapterScrollTop = 0
        thisBookList.books.forEach(item => {
          if (item.bookid.toString() == bookid) {
            readChapterNum = item.read.num
            readChapterScrollTop = item.read.top
          }
        })
        let thisBook = await Book.findById(bookid, 'id name img_url author newest_chapter').populate({
          path: 'chapters',
          match: {
            num: readChapterNum
          }
        })
        if (thisBook.chapters[0]) {
          const canReadResult = await canReadFunc(thisBook.chapters[0].num)
          ctx.body = {
            ok: true,
            canRead: canReadResult.canRead,
            autoBuy: canReadResult.autoBuy,
            doAutoBuy: canReadResult.doAutoBuy,
            msg: '获取章节详情成功',
            top: readChapterScrollTop,
            bookname: thisBook.name,
            headimg: thisBook.img_url,
            author: thisBook.author,
            newest: thisBook.newest_chapter,
            data: thisBook.chapters[0]
          }
        } else {
          ctx.body = { ok: false, msg: '获取章节详情失败' }
        }
      }
    }
  })

  router.get('/api/chapter/search', async (ctx, next) => {
    let { bookid, str } = ctx.request.query
    let queryArr = []
    queryArr.push({ name: new RegExp(str, 'igm') })
    let numReg = /^\d+$/
    if (numReg.test(str)) {
      queryArr.push({ num: str })
    }
    if (bookid) {
      if (str) {
        let thisBook = await Book.findById(bookid, 'id').populate({
          path: 'chapters',
          match: { $or: queryArr },
          select: 'name num',
          options: {
            sort: {
              num: 1
            }
          }
        })
        ctx.body = { ok: true, msg: '搜索目录成功', data: thisBook }
      } else {
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
          ctx.body = { ok: true, msg: '搜索目录成功', data: thisBook }
        } else {
          ctx.body = { ok: false, msg: '找不到对应的书籍' }
        }
      }
    } else {
      ctx.body = { ok: false, msg: '获取书籍信息失败，bookid不存在' }
    }
  })

  /**
   * 章节管理后台管理系统
   */
  router.get('/api/:book_id/chapter', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'chapter_get')
    if (userid) {
      let id = ctx.params.book_id
      let { page, limit } = ctx.request.query
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
      // query book
      let thisBook = await Book.findById(id, 'name newest_chapter chapters').populate({
        path: 'chapters',
        model: 'Chapter',
        options: { skip: (page - 1) * limit, limit: limit, sort: { num: 1 } }
      })
      let total = (await Book.findById(id, 'chapters')).chapters.length
      if (thisBook) {
        ctx.body = { ok: true, msg: '获取章节成功', total: total, data: thisBook }
      } else {
        ctx.body = { ok: false, msg: '获取章节失败，找不到这样的书籍' }
      }
    }
  })
  // add
  router.post('/api/:book_id/chapter', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'chapter_get')
    if (userid) {
      let id = ctx.params.book_id
      let { num, name, content } = ctx.request.body
      // format page and limit
      if (num || num === 0) {
        num = parseInt(num)
        if (name) {
          if (content) {
            // 判断num是否重复
            // 检查num是否重复
            let oldChapter = await Book.findById(id).populate({
              path: 'chapters',
              select: 'num'
            })
            let isExist = oldChapter.chapters.some(item => {
              return item.num == num
            })
            if (!isExist) {
              let addResult = await Chapter.create({
                num,
                name,
                content,
                create_time: new Date()
              })
              // 更新book.chapters
              if (addResult._id) {
                let updateResult = await Book.update(
                  { _id: id },
                  {
                    $addToSet: {
                      chapters: addResult._id
                    }
                  }
                )
                if (updateResult.ok) {
                  ctx.body = { ok: true, msg: '新增章节成功', data: addResult }
                } else {
                  ctx.body = { ok: false, msg: '新增章节失败' }
                }
              } else {
                ctx.body = { ok: false, msg: '新增章节失败' }
              }
            } else {
              ctx.body = { ok: false, msg: '章节序号重复' }
            }
          } else {
            ctx.body = { ok: false, msg: '章节内容不能为空' }
          }
        } else {
          ctx.body = { ok: false, msg: '章节名不能为空' }
        }
      } else {
        ctx.body = { ok: false, msg: '章节序数不能为空' }
      }
    }
  })
  // delete
  router.delete('/api/:book_id/chapter/:chapter_id', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'chapter_get')
    if (userid) {
      let book_id = ctx.params.book_id
      let chapter_id = ctx.params.chapter_id
      let thisBook = await Book.findById(book_id, 'chapters')
      let newChapters = thisBook.chapters.filter(item => {
        return item.toString() !== chapter_id
      })
      await Chapter.remove({ _id: chapter_id })
      let updateResult = await Book.update(
        { _id: book_id },
        {
          $set: {
            chapters: newChapters
          }
        }
      )
      if (updateResult.ok) {
        ctx.body = { ok: true, msg: '删除章节成功' }
      } else {
        ctx.body = { ok: false, msg: '删除章节失败' }
      }
    }
  })
  // 后台书籍列表更新
  router.patch('/api/chapter/:id', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'theme_update')
    if (userid) {
      let { name, num, author, content } = ctx.request.body
      let id = ctx.params.id
      let result = await Chapter.update(
        { _id: id },
        {
          $set: {
            name: name,
            num: num,
            content: content
          }
        }
      )
      if (result.ok === 1) {
        let newest = await Chapter.findById(id)
        ctx.body = { ok: true, msg: '更新章节成功', data: newest }
      } else {
        ctx.body = { ok: false, msg: '更新章节失败', data: result }
      }
    }
  })
  // 后台章节upload
  router.post('/api/:book_id/chapter_upload', convert(body()), async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'theme_update')
    if (userid) {
      let book_id = ctx.params.book_id
      let addErrors = []
      let rightNum = 0
      async function saveChapter(index, num, name, content) {
        if (num || num === 0) {
          num = parseInt(num)
          if (name) {
            if (content) {
              // 检查num是否重复
              let oldChapter = await Book.findById(book_id).populate({
                path: 'chapters',
                select: 'num'
              })
              let isExist = oldChapter.chapters.some(item => {
                return item.num == num
              })
              if (!isExist) {
                let addResult = await Chapter.create({
                  num,
                  name,
                  content,
                  create_time: new Date()
                })
                // 更新book.chapters
                if (addResult._id) {
                  let updateResult = await Book.update(
                    { _id: book_id },
                    {
                      $addToSet: {
                        chapters: addResult._id
                      }
                    }
                  )
                  if (updateResult.ok) {
                    rightNum++
                  } else {
                    addErrors.push('第' + ++index + '行更新Book.chapters失败')
                  }
                } else {
                  addErrors.push('第' + ++index + '行新增章节失败')
                }
              } else {
                addErrors.push('第' + ++index + '行章节序号重复')
              }
            } else {
              addErrors.push('第' + ++index + '行章节内容不能为空')
            }
          } else {
            addErrors.push('第' + ++index + '行章节名不能为空')
          }
        } else {
          addErrors.push('第' + ++index + '行章节序数不能为空')
        }
      }
      try {
        // 判断上传的文件是excel还是text
        const type = ctx.request.files[0].type
        const inputPath = ctx.request.files[0].path
        if (type === 'text/plain') {
          return new Promise(async (resolve, reject) => {
            try {
              // 已存在章节号
              let chapterHasExisted = await Book.findById(book_id).populate({
                path: 'chapters',
                select: 'num'
              })
              chapterHasExisted = chapterHasExisted.chapters.map(item => {
                return item.num
              })
              // 用户上传了txt
              const MB = 1024 * 1024 // 限制读取大小为1M
              const stream = new ReadStreamThrottle(fs.createReadStream(inputPath), MB)
              let lastChapterNumber = 1
              stream.on('data', async function(chunk) {
                const hasReadText = chunk.toString()
                // 只要匹配的第一项不是章节开头的，说明上一个章节是断章，需要剩余内容补回到原章节中
                const chapterTitleReg = /第?[零一二三四五六七八九十百千万0-9]+章(\s*|、*).*/gim
                const firstLine = hasReadText
                  .substring(0, 1000)
                  .split('\n')[0]
                  .trim()
                // console.log(firstLine, '===>', firstLine.search(chapterTitleReg))
                let startFromChapterTitle = false
                if (firstLine.match(chapterTitleReg)) {
                  startFromChapterTitle = true
                }
                let result = null
                let chapters = [] // 记录已经匹配到的章节
                let count = 0 // 记录匹配到的次数
                while ((result = chapterTitleReg.exec(hasReadText)) !== null) {
                  if (count === 0 && !startFromChapterTitle) {
                    // 更新断章
                    const thisChapter = await Book.findById(book_id).populate({
                      path: 'chapters',
                      match: { num: lastChapterNumber },
                      select: '_id num content'
                    })
                    if (thisChapter && thisChapter.chapters.length === 1) {
                      const updateResult = await Chapter.update(
                        { _id: thisChapter.chapters[0]._id },
                        {
                          $set: {
                            content: thisChapter.chapters[0].content + hasReadText.substring(1, result.index).trim()
                          }
                        }
                      )
                      // if (updateResult.ok) {
                      //   // console.log('\n更新断章成功，章节号: ' + thisChapter.chapters[0].num  + ', 断章内容:' + hasReadText.substring(1, result.index).trim().substring(0, 30) + '\n')
                      // }
                    }
                  }
                  const num = tool.chineseParseInt(result[0].match(/第?[零一二三四五六七八九十百千万0-9]+章/)[0])
                  const name = result[0]
                    .match(/(?<=章).*$/)[0]
                    .replace(/、/, '')
                    .trim()
                  chapters.push({
                    num,
                    name,
                    resultIndex: result.index + result[0].length,
                    lastIndex: chapterTitleReg.lastIndex - result[0].length
                  })
                  count++
                  lastChapterNumber = num
                }

                // 遍历chapter获取章节内容并存储
                for (let i = 0; i < chapters.length; i++) {
                  let content = ''
                  if (i === chapters.length - 1) {
                    content = hasReadText.substring(chapters[i].resultIndex).trim()
                  } else {
                    content = hasReadText.substring(chapters[i].resultIndex, chapters[i + 1].lastIndex).trim()
                  }
                  delete chapters[i].lastIndex
                  delete chapters[i].resultIndex
                  chapters[i].content = content

                  // 存储章节
                  if (chapterHasExisted.indexOf(chapters[i].num) > -1) {
                    const thisChapter = await Book.findById(book_id).populate({
                      path: 'chapters',
                      match: { num: chapters[i].num },
                      select: '_id num'
                    })
                    if (thisChapter && thisChapter.chapters.length === 1) {
                      if (chapters[i].num >= 1 && chapters[i].content && chapters[i].name.length <= 20) {
                        const updateResult = await Chapter.update(
                          { _id: thisChapter.chapters[0]._id },
                          {
                            $set: {
                              name: chapters[i].name,
                              content: chapters[i].content
                            }
                          }
                        )
                        if (updateResult.ok) {
                          rightNum++
                        } else {
                          addErrors.push(`第${chapters[i].num}章 ${chapters[i].name} 更新失败`)
                        }
                      } else {
                        console.log(chapters[i].num, chapters[i].content.substring(0, 10))
                        addErrors.push(`第${chapters[i].num}章 ${chapters[i].name} 内容错误，取消更新`)
                      }
                    } else {
                      addErrors.push(`第${chapters[i].num}章 ${chapters[i].name} 更新时查找失败`)
                    }
                  } else {
                    const addResut = await Chapter.create({
                      name: chapters[i].name,
                      num: chapters[i].num,
                      content: chapters[i].content,
                      create_time: new Date()
                    })
                    if (addResut._id) {
                      let updateResult = await Book.update(
                        { _id: book_id },
                        {
                          $addToSet: {
                            chapters: addResut._id
                          }
                        }
                      )
                      if (updateResult.ok) {
                        rightNum++
                        chapterHasExisted.push(chapters[i].num)
                      } else {
                        addErrors.push(`第${chapters[i].num}章 ${chapters[i].name} 创建成功，更新BOOK失败`)
                      }
                    } else {
                      addErrors.push(`第${chapters[i].num}章 ${chapters[i].name} 创建失败`)
                    }
                  }
                }
              })
              stream.on('finish', function() {
                ctx.body = { ok: true, msg: '上传成功', errors: addErrors, success: rightNum }
                resolve(next())
              })
              stream.on('error', error => {
                ctx.body = { ok: false, msg: '读取文件失败，请试着换成小一点的文档', errors: addErrors, success: rightNum }
                resolve(next())
              })
            } catch (err) {
              console.error(err)
              reject(next())
            }

            process.on('unhandledRejection', (reason, p) => {
              console.log('Unhandled Rejection at:', p, 'reason:', reason)
              // application specific logging, throwing an error, or other logic here
            })
          }).catch(error => {
            console.error(error)
          })
        } else if (type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
          // 用户上传了excel
          const uploadData = xlsx.parse(inputPath)
          // 保存章节
          if (uploadData && uploadData[0] && uploadData[0].data) {
            if (uploadData[0].data[0] instanceof Array && uploadData[0].data[0][0] === '章节序号') {
              for (let i = 1; i < uploadData[0].data.length; i++) {
                // console.log(i, uploadData[0].data[i][0], uploadData[0].data[i][1], uploadData[0].data[i][2])
                await saveChapter(i, uploadData[0].data[i][0], uploadData[0].data[i][1], uploadData[0].data[i][2])
              }
              ctx.body = { ok: true, msg: '上传成功', errors: addErrors, success: rightNum }
            } else {
              ctx.body = { ok: false, msg: 'excel文件格式错误' }
            }
          } else {
            ctx.body = { ok: false, msg: 'excel文件格式错误' }
          }
        } else {
          ctx.body = { ok: false, msg: '上传的文件格式错误' }
        }
      } catch (err) {
        console.log(err)
        ctx.body = { ok: false, msg: '上传并存储章节失败', error: err }
      }
    }
  })

  // 章节购买接口
  router.get('/api/chapter/buy', async (ctx, next) => {
    const bookid = ctx.request.query.bookid
    const chapter_num = parseInt(ctx.request.query.chapter_num)
    if (!bookid || !chapter_num) {
      ctx.body = { ok: false, msg: '参数错误' }
      next()
      return
    }
    let userid = await checkUserToken(ctx, next)
    if (!userid) {
      return
    }
    // 获取查询得到商品id
    const thisGood = await Good.findOne({ bookid })
    if (thisGood.type === 4) {
      ctx.body = { ok: true, msg: '书籍免费' }
      next()
      return
    } else if (thisGood.type === 3) {
      if (chapter_num <= thisGood.limit_chapter) {
        ctx.body = { ok: true, msg: '书籍免费' }
        next()
        return
      }
    } else if (thisGood.type === 2) {
      const now = new Date().getTime()
      if (now >= thisGood.limit_start_time.getTime() && now <= thisGood.limit_end_time.getTime()) {
        ctx.body = { ok: true, msg: '书籍免费' }
        next()
        return
      }
    }
    // 扣除用户书币
    const reduceResult = await User.reduceAmount(userid, thisGood.prise)
    if (reduceResult) {
      // 开始生成购买订单
      const newBuy = await Buy.create({
        goodid: await Buy.transId(thisGood.id),
        userid: await Buy.transId(userid),
        amount: parseInt(thisGood.prise),
        chapter: chapter_num,
        des: moment().format('YYYY-MM-DD hh:mm:ss') + ' 购买章节 ' + chapter_num,
        create_time: new Date()
      })
      ctx.body = { ok: true, msg: '购买成功' }
    } else {
      ctx.body = { ok: false, msg: '购买失败', nomoney: true }
    }
  })
}
