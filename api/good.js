import { Good, Book } from '../models'

export default function(router) {
  router.post('/api/good', async (ctx, next) => {
    let { bookid, type, limit_start_time, limit_end_time, limit_chapter, prise } = ctx.request.body
    if (bookid) {
      if (type) {
        type = parseInt(type)
        if (type === 1 || type === 4) {
          // do nothing
        } else if (type === 2) {
          if (!limit_start_time || !limit_end_time) {
            ctx.body = { ok: false, msg: '请指定书籍限时免费的起始时间和结束时间' }
            await next()
            return
          } else {
            limit_start_time = new Date(limit_start_time)
            limit_end_time = new Date(limit_end_time)
          }
        } else if (type === 3) {
          if (!limit_chapter) {
            ctx.body = { ok: false, msg: '请指定书籍限定免费章节' }
            await next()
            return
          } else {
            limit_chapter = parseInt(limit_chapter)
          }
        } else {
          ctx.body = { ok: false, msg: 'type参数只能取1，2，3，4' }
          await next()
          return
        }
        if (prise) {
          prise = parseFloat(prise)
          // 查找对应书籍是否存在
          let thisBook = await Book.findById(bookid)
          if (thisBook) {
            let thisGood = await Good.create({
              bookid: thisBook.id,
              type: type,
              limit_start_time: limit_start_time || null,
              limit_end_time: limit_end_time || null,
              limit_chapter: limit_chapter || null,
              prise: prise,
              create_time: new Date()
            })
            if (thisGood) {
              ctx.body = { ok: true, msg: '添加商品成功', data: thisGood }
            } else {
              ctx.body = { ok: false, msg: '添加商品失败', data: thisGood }
            }
          } else {
            ctx.body = { ok: false, msg: '未找到此书籍' }
          }
        } else {
          ctx.body = { ok: false, msg: '请设定商品价格' }
          await next()
          return
        }
      } else {
        ctx.body = { ok: false, msg: '缺乏type参数' }
      }
    } else {
      ctx.body = { ok: false, msg: '缺乏bookid参数' }
    }
  })

  router.get('/api/good', async (ctx, next) => {
    let { page, limit, name } = ctx.request.query
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
      if (limit < 1) {
        limit = 10
      }
    } else {
      limit = 10
    }
    // 如果需要根据书籍指定书籍名称查询
    if (name) {
      const reg = new RegExp(name, 'i')
      let result = await Book.find(
        {
          $or: [{ name: reg }, { author: reg }]
        },
        '_id name author img_url classification'
      ).sort({ create_time: -1 })
      let allPromise = []
      // 执行异步查询操作
      result.forEach(item => {
        allPromise.push(
          new Promise((resolve, reject) => {
            Good.findOne({ bookid: item._id }, (err, res) => {
              if (err) {
                reject(err)
              } else {
                // 如果查到了好友助力书籍，需要附件书籍的额外信息
                if (res) {
                  let obj = {}
                  obj.create_time = res.create_time
                  obj.limit_chapter = res.limit_chapter
                  obj.limit_end_time = res.limit_end_time
                  obj.limit_start_time = res.limit_start_time
                  obj.type = res.type
                  obj.bookid = {
                    _id: item._id,
                    name: item.name,
                    img_url: item.img_url,
                    author: item.author,
                    classification: item.classification
                  }
                  resolve(obj)
                } else {
                  resolve(res)
                }
              }
            })
          })
        )
      })
      return new Promise((resolve, reject) => {
        Promise.all(allPromise)
          .then(res => {
            // 排除res中查询为空的项
            res = res.filter(item => {
              return !!item
            })
            // 排序
            res.sort((item1, item2) => {
              return item1.create_time.getTime() - item2.create_time.getTime()
            })
            let total = res.length
            // 根据page和limit截取数组
            res = res.slice((page - 1) * limit, page * limit)
            ctx.body = { ok: true, total: total, list: res, msg: '获取好友助力书籍成功' }
            resolve(true)
          })
          .catch(err => {
            ctx.body = { ok: false, msg: '获取好友助力书籍失败', err: err }
            resolve(true)
          })
      })
    } else {
      let allGoodNum = await Good.count()
      let goods = await Good.find()
        .populate({
          path: 'bookid',
          select: '_id name author img_url classification'
        })
        .sort({ create_time: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
      ctx.body = { ok: true, msg: '获取商品成功', total: allGoodNum, list: goods }
    }
  })

  router.put('/api/good/:goodid', async (ctx, next) => {
    let goodid = ctx.params.goodid
    let { bookid, type, limit_start_time, limit_end_time, limit_chapter, prise } = ctx.request.body
    if (goodid) {
      // 检查gooid
      let thisGood = await Good.findById(goodid)
      if (thisGood) {
        let updateObj = {}
        if (bookid) {
          // 查找对应的书籍
          let thisBook = await Book.findById(bookid)
          if (thisBook) {
            updateObj.bookid = thisBook.id
          } else {
            ctx.body = { ok: false, msg: '未找到对应的书籍' }
            await next()
            return
          }
        }
        if (type) {
          type = parseInt(type)
          updateObj.type = type
          if (type === 1 || type === 4) {
            // do nothing
          } else if (type === 2) {
            if (limit_start_time && limit_end_time) {
              updateObj.limit_start_time = new Date(limit_start_time)
              updateObj.limit_end_time = new Date(limit_end_time)
            } else {
              ctx.body = { ok: false, msg: '请指定书籍限时免费时间' }
              await next()
              return
            }
          } else if (type === 3) {
            if (limit_chapter) {
              updateObj.limit_chapter = limit_chapter
            } else {
              ctx.body = { ok: false, msg: '请指定书籍限定免费章节数' }
              await next()
              return
            }
          } else {
            ctx.body = { ok: false, msg: 'type参数只能取1，2，3，4' }
            await next()
            return
          }
        }
        if (prise) {
          updateObj.prise = prise
        }
        if (JSON.stringify(updateObj) === '{}') {
          ctx.body = { ok: false, msg: '没有更新项' }
          await next()
          return
        } else {
          let updateResult = await Good.update({ _id: goodid }, { $set: updateObj })
          if (updateResult.ok === 1) {
            ctx.body = { ok: true, msg: '更新成功', data: await Good.findById(goodid) }
          } else {
            ctx.body = { ok: false, msg: '更新失败', data: updateResult }
          }
        }
      } else {
        ctx.body = { ok: false, msg: '未找到对应的商品' }
        await next()
      }
    } else {
      ctx.body = { ok: false, msg: '缺乏参数gooid' }
      await next()
    }
  })

  router.delete('/api/good/:goodid', async (ctx, next) => {
    let goodid = ctx.params.goodid
    // 检查gooid
    if (goodid) {
      let thisGood = await Good.findById(goodid)
      if (thisGood) {
        let deleTeResult = await Good.remove({ _id: goodid })
        if (deleTeResult.result.ok === 1) {
          ctx.body = { ok: true, msg: '删除商品成功' }
        } else {
          ctx.body = { ok: false, msg: '删除商品失败', data: deleTeResult.result }
        }
      } else {
        ctx.body = { ok: false, msg: '找不到对应的商品' }
      }
    } else {
      ctx.body = { ok: false, msg: '缺乏goodid参数' }
    }
  })
}
