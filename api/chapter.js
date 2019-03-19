import { Book, Chapter, BookList, Good, User, Buy, Secret } from '../models'
import { checkAdminToken, checkUserToken, tool } from '../utils'
import { readUpdateNotice } from '../bin/readUpdateNotice'
// TEST
// readUpdateNotice('5bf94fad7510f918441f0ef0', '5bf94fec2f5aa418a58f2486')
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
  /**
   * 小程序端获取章节列表的接口
   * @method get
   * @param {String} bookid 书籍id
   * @param {Number} pageid 当期目录翻页数
   */
  router.get('/api/chapter/list', async (ctx, next) => {
    let { bookid, pageid, limit } = ctx.request.query
    if (!pageid) {
      pageid = 1
    }
    if (!limit) {
      limit = 50
    }

    let total = await Chapter.count({ bookid })
    let lists = await Chapter.find({ bookid }, 'num name')
      .sort({ num: 1 })
      .skip((pageid - 1) * limit)
      .limit(limit)
    
    ctx.body = { ok: true, msg: '获取章节列表成功', list: lists, total }
  })

  /**
   * 小程序端获取章节详情
   * @method get
   * @param {String} bookid 书籍id，可选值
   * @param {String} chapter_id 章节id，可选值
   * @param {String} chapter_num 章节序号，可选值
   */
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
                    des: moment().format('YYYY-MM-DD HH:mm:ss') + ' 自动购买章节 ' + num,
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
        const thisBook = await Book.findById(bookid, 'name img_url author newest_chapter update_status')
        if (thisChapter._id) {
          const canReadResult = await canReadFunc(thisChapter.num)
          ctx.body = {
            ok: true,
            msg: '获取章节详情成功',
            canRead: canReadResult.canRead,
            autoBuy: canReadResult.autoBuy,
            doAutoBuy: canReadResult.doAutoBuy,
            bookname: thisBook.name,
            headimg: thisBook.img_url,
            author: thisBook.author,
            newest: thisBook.newest_chapter,
            update_status: thisBook.update_status,
            top: 0,
            scroll: 0,
            data: thisChapter
          }
        } else {
          ctx.body = { ok: false, msg: '获取章节详情失败' }
        }
      } else if (chapter_num) {
        // 通过传递章节数获取章节内容
        const thisChapter = await Chapter.findOne({ bookid, num: chapter_num })
        const thisBook = await Book.findById(bookid, 'name img_url author newest_chapter update_status')
        if (thisChapter) {
          const canReadResult = await canReadFunc(thisChapter.num)
          ctx.body = {
            ok: true,
            msg: '获取章节详情成功',
            canRead: canReadResult.canRead,
            autoBuy: canReadResult.autoBuy,
            doAutoBuy: canReadResult.doAutoBuy,
            top: 0,
            scroll: 0,
            bookname: thisBook.name,
            headimg: thisBook.img_url,
            author: thisBook.author,
            newest: thisBook.newest_chapter,
            update_status: thisBook.update_status,
            data: thisChapter
          }
        } else {
          ctx.body = { ok: false, msg: '获取章节详情失败' }
        }
      } else {
        // 去booklist里读取用户阅读进度
        const thisBookList = await BookList.findOne({ userid })
        let readChapterNum = 1
        let readChapterScrollTop = 0
        let readChapterScroll = 0
        let hasRssTheBook = false
        if (thisBookList) {
          thisBookList.books.forEach(item => {
            if (item.bookid.toString() == bookid) {
              readChapterNum = item.read.num
              readChapterScrollTop = item.read.top
              readChapterScroll = item.read.scroll || 0
              hasRssTheBook = item.rss
            }
          })
        }
        const thisChapter = await Chapter.findOne({ bookid, num: readChapterNum })
        const thisBook = await Book.findById(bookid, 'name img_url author newest_chapter update_status')
        if (thisChapter) {
          const canReadResult = await canReadFunc(thisChapter.num)
          ctx.body = {
            ok: true,
            msg: '获取章节详情成功',
            canRead: canReadResult.canRead,
            autoBuy: canReadResult.autoBuy,
            doAutoBuy: canReadResult.doAutoBuy,
            top: readChapterScrollTop,
            scroll: readChapterScroll,
            bookname: thisBook.name,
            headimg: thisBook.img_url,
            author: thisBook.author,
            newest: thisBook.newest_chapter,
            update_status: thisBook.update_status,
            rss: hasRssTheBook,
            data: thisChapter
          }
        } else {
          ctx.body = { ok: false, msg: '获取章节详情失败' }
        }
      }
    }
  })

  /**
   * 小程序端章节搜索
   * @method get
   * @param {String} 书籍id
   * @param {String} 搜索文字
   */
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
        let thisChapter = await Chapter.find({ bookid, '$or': queryArr }, 'name num').sort({ num: 1 }).limit(50)
        ctx.body = { ok: true, msg: '搜索目录成功', data: thisChapter }
      } else {
        let thisChapter = await Chapter.find({ bookid }, 'name num').sort({ num: 1 }).limit(50)
        ctx.body = { ok: true, msg: '搜索目录成功', data: thisChapter }
      }
    } else {
      ctx.body = { ok: false, msg: '获取书籍信息失败，bookid不存在' }
    }
  })

  /**
   * 后台管理获取章节列表，支持分页
   * @method get
   * @param {String} book_id 书籍id
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

      let total = await Chapter.count({ bookid: id })
      let thisChapter = await Chapter.find({ bookid: id })
        .sort({ num: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
      
      let thisBook = await Book.findById(id, 'name newest_chapter')
      
      ctx.body = { ok: true, msg: '获取章节成功', total: total, lists: thisChapter, bookInfo: thisBook }
    }
  })
  
  /**
   * 后台管理新增章节
   * @method post
   * @param {String} book_id 书籍id
   */
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
            // 检查num是否重复
            let oldChapter = await Chapter.findOne({ bookid: id, num })
            if (!oldChapter) {
              let addResult = await Chapter.create({
                bookid: await Chapter.transId(id),
                num,
                name,
                content,
                create_time: new Date()
              })
              // 更新book.chapters
              if (addResult._id) {
                // 更改书籍更新时间
                Book.updateTime(id)
                // 阅读更新通知
                console.log(`开始发送书籍更新提示, 书籍id ${id} 章节id ${addResult._id}`)
                readUpdateNotice(id, addResult._id)
                ctx.body = { ok: true, msg: '新增章节成功', data: addResult }
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
  /**
   * 后台管理删除章节
   * @method delete
   * @param {String} book_id 书籍id
   * @param {String} chapter_id 章节id
   */
  router.delete('/api/chapter/:chapter_id', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'chapter_get')
    if (userid) {
      let chapter_id = ctx.params.chapter_id
      let thisChapter = await Chapter.findById(chapter_id)
      if (!thisChapter) {
        ctx.body = { ok: false, msg: '删除章节失败，章节不存在' }
        return false
      }
      await Chapter.remove({ _id: chapter_id })
      let newestChapter = await Chapter.findOne({ bookid: thisChapter.bookid }, 'num').sort({ num: -1 }).limit(1)
      console.log(newestChapter.num);
      let updateResult = await Book.update(
        { _id: thisChapter.bookid.toString() },
        {
          $set: {
            newest_chapter: newestChapter.num,
          }
        }
      )
      if (updateResult.ok) {
        // 更改书籍更新时间
        Book.updateTime(thisChapter.bookid.toString())
        ctx.body = { ok: true, msg: '删除章节成功' }
      } else {
        ctx.body = { ok: false, msg: '删除章节失败' }
      }
    }
  })

  /**
   * 后台管理章节更新
   * @method patch
   * @param {String} id 章节id
   * @param {String} name 章节名称
   * @param {Number} num 章节序号
   * @param {String} conent 章节内容
   */
  router.patch('/api/chapter/:id', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'theme_update')
    if (userid) {
      let { name, num, content } = ctx.request.body
      let id = ctx.params.id
      let thisChapter = await Chapter.findById(id, 'bookid')
      if (!thisChapter) {
        ctx.body = { ok: false, msg: '更新章节失败，找不到对应章节' }
        return false
      }
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
        // 更改书籍更新时间
        Book.updateTime(thisChapter.bookid.toString())
        let newest = await Chapter.findById(id)
        ctx.body = { ok: true, msg: '更新章节成功', data: newest }
      } else {
        ctx.body = { ok: false, msg: '更新章节失败', data: result }
      }
    }
  })

  /**
   * 后台管理章节上传
   * @method post
   * @param {String} book_id 书籍id
   */
  router.post('/api/:book_id/chapter_upload', convert(body()), async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'chapter_upload')
    if (userid) {
      let book_id = ctx.params.book_id
      let addErrors = []
      let rightNum = 0
      let lastChapterId = '' // 最后一章的ID
      async function saveChapter(index, num, name, content) {
        if (num || num === 0) {
          num = parseInt(num)
          if (name) {
            if (content) {
              // 检查num是否重复
              let oldChapter = await Chapter.findOne({ bookid: book_id, num })
              if (!oldChapter) {
                let addResult = await Chapter.create({
                  bookid: await Chapter.transId(book_id),
                  num,
                  name,
                  content,
                  create_time: new Date()
                })
                // 更新book.chapters
                if (addResult._id) {
                  rightNum++
                  console.log(addResult._id);
                  return addResult._id
                } else {
                  addErrors.push('第' + ++index + '行新增章节失败')
                  return ''
                }
              } else {
                // 不再提示错误，自动覆盖原来章节
                let updateResult = await Chapter.update(
                  {
                    _id: oldChapter.id
                  },
                  {
                    $set: {
                      name: name,
                      content: content,
                      create_time: new Date()
                    }
                  }
                )
                if (updateResult.ok) {
                  rightNum++
                  return oldChapter.id
                } else {
                  addErrors.push('第' + ++index + '行章节更新失败')
                  return ''
                }
              }
            } else {
              addErrors.push('第' + ++index + '行章节内容不能为空')
              return ''
            }
          } else {
            addErrors.push('第' + ++index + '行章节名不能为空')
            return ''
          }
        } else {
          addErrors.push('第' + ++index + '行章节序数不能为空')
          return ''
        }
      }

      // 开始处理上传的文件
      try {
        // 判断上传的文件是excel还是text
        const type = ctx.request.files[0].type
        const inputPath = ctx.request.files[0].path
        if (type === 'text/plain') {
          return new Promise(async (resolve, reject) => {
            try {
              // 已存在章节号
              let chapterHasExisted = await Chapter.find({ bookid: book_id }, 'num')
              chapterHasExisted = chapterHasExisted.map(item => {
                return item.num
              })
              // 用户上传了txt
              const MB = 1024 * 1024 // 限制读取大小为1M
              const stream = new ReadStreamThrottle(fs.createReadStream(inputPath), MB)
              let lastChapterNumber = 1
              let readProgress = []
              stream.on('data', async function(chunk) {
                readProgress.push(
                  new Promise(async (resolve, reject) => {
                    const hasReadText = chunk.toString()
                    // 只要匹配的第一项不是章节开头的，说明上一个章节是断章，需要剩余内容补回到原章节中
                    const chapterTitleReg = /第?[零一二两三叁四五六七八九十百千万壹贰叁肆伍陆柒捌玖拾佰0-9]+章(\s*|、*).*/gim
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
                        let thisChapter = await Chapter.findOne({ bookid: book_id, num: lastChapterNumber }, 'content')
                        await Chapter.update(
                          {
                            bookid: book_id,
                            num: lastChapterNumber
                          },
                          {
                            $set: {
                              content: thisChapter.content + hasReadText.substring(1, result.index).trim()
                            }
                          }
                        )
                       }
                      const num = tool.chineseParseInt(result[0].match(/第?[零一二两三叁四五六七八九十百千万壹贰叁肆伍陆柒捌玖拾佰0-9]+章/)[0])
                      const name = result[0]
                        .match(/(?<=章).*$/)[0]
                        .replace(/^(、*)(\.*)(：)/, '')
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
                        // 数据库中已存在当前章节，做更新
                        let thisChapter = await Chapter.findOne({ bookid: book_id, num: chapters[i].num }, 'num')
                        if (thisChapter) {
                          if (chapters[i].num >= 1 && chapters[i].content && chapters[i].name.length <= 20) {
                            const updateResult = await Chapter.update(
                              { _id: thisChapter.id },
                              {
                                $set: {
                                  name: chapters[i].name,
                                  content: chapters[i].content
                                }
                              }
                            )
                            if (updateResult.ok) {
                              lastChapterId = thisChapter.chapters[0]._id
                              rightNum++
                            } else {
                              addErrors.push(`第${chapters[i].num}章 ${chapters[i].name} 更新失败`)
                            }
                          } else {
                            addErrors.push(`第${chapters[i].num}章 ${chapters[i].name} 内容错误，取消更新`)
                          }
                        } else {
                          addErrors.push(`第${chapters[i].num}章 ${chapters[i].name} 更新时查找失败`)
                        }
                      } else {
                        // 数据库中不存在当前章节，做新增
                        const addResut = await Chapter.create({
                          bookid: await Chapter.transId(book_id),
                          name: chapters[i].name,
                          num: chapters[i].num,
                          content: chapters[i].content,
                          create_time: new Date()
                        })
                        if (addResut._id) {
                          lastChapterId = addResut._id
                          rightNum++
                          chapterHasExisted.push(chapters[i].num)
                        } else {
                          addErrors.push(`第${chapters[i].num}章 ${chapters[i].name} 创建失败`)
                        }
                      }
                    }
                    resolve(true)
                  })
                )
              })
              stream.on('end', function() {
                console.log('读取完成...')
                // 上传结束
                Promise.all(readProgress).then(res => {
                  console.log('上传结束...')
                  // 更改书籍更新时间
                  Book.updateTime(book_id)
                  console.log(`开始发送书籍更新提示, 书籍id ${book_id} 章节id ${lastChapterId}`)
                  readUpdateNotice(book_id, lastChapterId)
                  ctx.body = { ok: true, msg: '上传成功', errors: addErrors, success: rightNum }
                  resolve(next())
                })
              })
              stream.on('error', error => {
                ctx.body = { ok: false, msg: '读取文件失败，请试着换成小一点的文档', errors: addErrors, success: rightNum }
                resolve(next())
              })
            } catch (err) {
              console.error(err)
              reject(next())
            }
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
                lastChapterId = await saveChapter(i, uploadData[0].data[i][0], uploadData[0].data[i][1], uploadData[0].data[i][2])
              }
              Book.updateTime(book_id)
              console.log(`开始发送书籍更新提示, 书籍id ${book_id} 章节id ${lastChapterId}`)
              readUpdateNotice(book_id, lastChapterId)
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
        des: moment().format('YYYY-MM-DD HH:mm:ss') + ' 购买章节 ' + chapter_num,
        create_time: new Date()
      })
      ctx.body = { ok: true, msg: '购买成功' }
    } else {
      ctx.body = { ok: false, msg: '购买失败', nomoney: true }
    }
  })
}
