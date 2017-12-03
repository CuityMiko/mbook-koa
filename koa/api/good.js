import { Good, Book } from '../models'

export default function (router) {
    router.post('/api/good', async (ctx, next) => {
        let { bookid, type, limit_start_time, limit_end_time, limit_chapter, prise } = ctx.request.body
        if(bookid){
          if(type){
            type = parseInt(type)
            if(type === 0){
              // do nothing
            }else if(type === 1){
              if(!limit_start_time || !limit_end_time){
                ctx.body = { ok: false, msg: "请指定书籍限时免费的起始时间和结束时间" }
                await next()
                return
              }else{
                limit_start_time = new Date(limit_start_time)
                limit_end_time = new Date(limit_end_time)
              }
            }else if(type === 2){
              if(!limit_chapter){
                ctx.body = { ok: false, msg: "请指定书籍限定免费章节" }
                await next()
                return
              }else{
                limit_chapter = parseInt(limit_chapter)
              }
            }else{
              ctx.body = { ok: false, msg: "type参数只能取0，1，2" }
              await next()
              return
            }
            if(prise){
              prise = parseFloat(prise)
              // 查找对应书籍是否存在
              let thisBook = await Book.findById(bookid)
              if(thisBook){
                let thisGood = await Good.create({
                  bookid: thisBook.id,
                  type: type,
                  limit_start_time: limit_start_time || null,
                  limit_end_time: limit_end_time || null,
                  limit_chapter: limit_chapter || null,
                  prise: prise,
                  create_time: new Date()
                })
                if(thisGood){
                  ctx.body = { ok: true, msg: "添加商品成功", data: thisGood }
                }else{
                  ctx.body = { ok: false, msg: "添加商品失败", data: thisGood }
                }
              }else{
                ctx.body = { ok: false, msg: "未找到此书籍" }
              }
            }else{
              ctx.body = { ok: false, msg: "请设定商品价格" }
              await next()
              return
            }
          }else{
            ctx.body = { ok: false, msg: "缺乏type参数" }
          }
        }else{
          ctx.body = { ok: false, msg: "缺乏bookid参数" }
        }
    })

    router.get('/api/good/list', async (ctx, next) => {
      let { page, limit } = ctx.request.query
      if(page){
        page = parseInt(page)
        if(page < 1){
          page = 1
        }
      }else{
        page = 1
      }
      if(limit){
        limit = parseInt(limit)
        if(limit < 1){
          limit = 10
        }
      }else{
        limit = 10
      }
      let allGoodNum = await Good.count()
      let goods = await Good.find()
                            .sort({ 'create_time': -1 })
                            .skip((page - 1) * limit)
                            .limit(limit)
      ctx.body = { ok: true, msg: '获取商品成功', total: allGoodNum, list: goods }
    })

    router.put('/api/good/:goodid', async (ctx, next) => {
      let goodid = ctx.params.goodid
      let { bookid, type, limit_start_time, limit_end_time, limit_chapter, prise } = ctx.request.body
      if(goodid){
        // 检查gooid
        let thisGood = await Good.findById(goodid)
        if(thisGood){
          let updateObj = {}
          if(bookid){
            // 查找对应的书籍
            let thisBook = await Book.findById(bookid)
            if(thisBook){
              updateObj.bookid = thisBook.id
            }else{
              ctx.body = { ok: false, msg: '未找到对应的书籍' }
              await next()
              return
            }
          }
          if(type){
            type = parseInt(type)
            updateObj.type = type
            console.log(type)
            if(type === 0){
              // do nothing
            }else if(type === 1){
              if(limit_start_time && limit_end_time){
                updateObj.limit_start_time = new Date(limit_start_time)
                updateObj.limit_end_time = new Date(limit_end_time)
              }else{
                ctx.body = { ok: false, msg: "请指定书籍限时免费时间" }
                await next()
                return
              }
            }else if(type === 2){
              if(limit_chapter){
                updateObj.limit_chapter = limit_chapter
              }else{
                ctx.body = { ok: false, msg: "请指定书籍限定免费章节数" }
                await next()
                return
              }
            }else{
              ctx.body = { ok: false, msg: "type参数只能取0，1，2" }
              await next()
              return
            }
          }
          if(prise){
            updateObj.prise = prise
          }
          if(JSON.stringify(updateObj) === "{}"){
            ctx.body = { ok: false, msg: "没有更新项" }
            await next()
            return
          }else{
            let updateResult = await Good.update({ _id: goodid }, { $set: updateObj})
            console.log(updateResult)
            if(updateResult.ok === 1){
              ctx.body = { ok: true, msg: '更新成功', data: await Good.findById(goodid) }
            }else{
              ctx.body = { ok: false, msg: '更新失败', data: updateResult }
            }
          }
        }else{
          ctx.body = { ok: false, msg: '未找到对应的商品' }
          await next()
        }
      }else{
        ctx.body = { ok: false, msg: '缺乏参数gooid' }
        await next()
      }
    })

    router.delete('/api/good/:goodid', async (ctx, next) => {
      let goodid = ctx.params.goodid
      // 检查gooid
      if(goodid){
        let thisGood = await Good.findById(goodid)
        if(thisGood){
          let deleTeResult = await Good.remove({ _id: goodid })
          if(deleTeResult.result.ok === 1){
              ctx.body = { ok: true, msg: '删除商品成功' }
          }else{
              ctx.body = { ok: false, msg: '删除商品失败', data: deleTeResult.result }
          }
        }else{
          ctx.body = { ok: false, msg: '找不到对应的商品' }
        }       
      }else{
        ctx.body = { ok: false, msg: '缺乏goodid参数' }
      }
    })
}
