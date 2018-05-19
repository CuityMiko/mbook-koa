import { Award } from '../models'
import { checkUserToken } from '../utils'

export default function(router) {
  router.get('/api/award/list', async (ctx, next) => {
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
      const total = await Award.count({ userid })
      const awards = await Award.find({ userid }, 'amount des create_time')
        .sort({ create_time: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
      ctx.body = { ok: true, total, list: awards, msg: '获取奖励记录成功' }
    }
  })
}
