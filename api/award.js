import { Award } from '../models'
import { jwtVerify } from '../utils'

export default function(router) {
  router.get('/api/award/list', async (ctx, next) => {
    if (ctx.header.authorization && ctx.header.authorization.split(' ').length > 0) {
      const payload = await jwtVerify(ctx.header.authorization.split(' ')[1])
      const userid = payload.userid
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
    } else {
      ctx.body = { ok: false, msg: '用户认证失败' }
    }
  })
}
