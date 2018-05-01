import { checkAdminToken, jwtVerify, tool } from '../utils'
import { Share, User } from '../models'

export default function (router) {
  // 创建一条分享记录
  router.get('/api/share/new', async (ctx, next) => {
    const source = ctx.request.query.source
    if (source) {
      if (ctx.header.authorization && ctx.header.authorization.split(' ').length > 0) {
        const payload = await jwtVerify(ctx.header.authorization.split(' ')[1])
        const launch_uid = payload.userid
        const newShare = await Share.create({
          launch_uid,
          source,
          accept_records: [],
          create_time: Date.now()
        })
        ctx.body = { ok: true, msg: '新增分享记录成功', share_id: newShare.id }
      } else {
        ctx.body = { ok: false, msg: '用户认证失败' }
      }
    } else {
      ctx.body = { ok: false, msg: '参数错误' }
    }
  })
  // 更新分享记录，在每次被邀请用户登录之后
  router.get('/api/share/update', async (ctx, next) => {
    const share_id = ctx.request.query.share_id
    if (share_id) {
      if (ctx.header.authorization && ctx.header.authorization.split(' ').length > 0) {
        const payload = await jwtVerify(ctx.header.authorization.split(' ')[1])
        const accept_uid = payload.userid
        const thisShareLog = await Share.findById(share_id)
        if (thisShareLog) {
          // 限制自己不能邀请自己
          if (thisShareLog.launch_uid.toString() !== accept_uid) {
            const now = new Date()
            const updateResult = await Share.update({ _id: share_id }, {
              $addToSet: {
                accept_records: {
                  uid: await Share.transId(accept_uid),
                  time: now
                }
              }
            })
            if (updateResult.ok) {
              // 判断是否分享和邀请关系是否处理24小时的有效期内
              if ((now.getTime() - thisShareLog.create_time.getTime()) < 24 * 60 * 60 * 1000) {
                // 分发奖励
                const acceptAward = await User.addAmount(accept_uid, 15)
                const launchAward = await User.addAmount(thisShareLog.launch_uid.toString(), 15)
                if (acceptAward && launchAward) {
                  ctx.body = { ok: true, msg: '更新记录成功' }
                } else {
                  ctx.body = { ok: false, msg: '发放奖励失败' }
                }
              } else {
                ctx.body = { ok: false, msg: '邀请已经过期' }
              }
            }
          } else {
            ctx.body = { ok: false, msg: '参数错误，自己不能邀请自己' }
          }
        } else {
          ctx.body = { ok: false, msg: '参数错误' }
        }
      } else {
        ctx.body = { ok: false, msg: '用户认证失败' }
      }
    } else {
      ctx.body = { ok: false, msg: '参数错误' }
    }
  })
}
