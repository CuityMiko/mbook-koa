import { Buy } from '../models'
import { checkUserToken } from '../utils'

export default function(router) {
  router.get('/api/buy/list', async (ctx, next) => {
    let userid = await checkUserToken(ctx, next)
    if (userid) {
      let { page, limit } = ctx.request.query
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
      const total = await Buy.count({ userid })
      let buys = await Buy.find({ userid }, 'goodid amount chapter create_time')
        .populate({
          path: 'goodid',
          select: 'bookid',
          populate: {
            path: 'bookid',
            select: 'img_url name'
          }
        })
        .sort({ create_time: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
      buys = buys.map(item => {
        let tmp = {}
        tmp.img_url = item.goodid.bookid.img_url
        tmp.amount = item.amount
        tmp.book_name = item.goodid.bookid.name
        tmp.chapter_num = item.chapter
        tmp.create_time = item.create_time
        return tmp
      })
      ctx.body = { ok: true, total, list: buys, msg: '获取我的消费记录成功' }
    }
  })
}
