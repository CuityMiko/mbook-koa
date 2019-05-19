import { Notice } from '../models'
import { checkUserToken, checkAdminToken } from '../utils'

export default function(router) {
  router.post('/api/notice', async (ctx, next) => {
    const userid = await checkAdminToken(ctx, next)
    if (userid) {
      const { title='', description='', content='', users='' } = ctx.request.body
      if (!users) {
        ctx.body = { ok: false, msg: '发送用户不能为空' }
        return
      }
      if (!title) {
        ctx.body = { ok: false, msg: '标题不能为空' }
        return
      }
      if (!description) {
        ctx.body = { ok: false, msg: '描述不能为空' }
        return
      }
      if (!content) {
        ctx.body = { ok: false, msg: '内容不能为空' }
        return
      }

      const notice = await Notice.create({
        user: users,
        type: 'system',
        title,
        description,
        content,
        create_time: new Date()
      })
      ctx.body = { ok: true, data: notice, msg: '创建通知成功' }
    }
  })
}
