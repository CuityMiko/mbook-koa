import { Good, Book } from '../models'

export default function (router) {
    router.post('/api/good/add', async (ctx, next) => {
        let { bookid, type, limitTime, limitChapter, prise } = ctx.request.body
        if(bookid){
          if(type){
            type = parseInt(type)
            if(type === 0){
              // do nothing
            }else if(type === 1){
              if(!limitTime){
                ctx.body = { ok: false, msg: "请指定书籍限时免费时间" }
                await next()
                return
              }else{
                limitTime = new Date(limitTime)
              }
            }else if(type === 2){
              if(!limitChapter){
                ctx.body = { ok: false, msg: "请指定书籍限定免费章节" }
                await next()
                return
              }else{
                limitChapter = parseInt(limitChapter)
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
              console.log(thisBook)
              if(thisBook){
                let thisGood = await Good.create({
                  bookid: thisBook.id,
                  type: type,
                  limit_time: limitTime || null,
                  limit_chapter: limitChapter || null,
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
}
