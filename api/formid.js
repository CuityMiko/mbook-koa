import { FormId } from '../models'
import { checkUserToken, tool } from '../utils'

export default function(router) {
  router.get('/api/upload_formid', async (ctx, next) => {
    let userid = await checkUserToken(ctx, next)
    if (userid) {
      let formId = ctx.request.query.formId
      let bookId = ctx.request.query.bookId
      if (!bookId) {
        ctx.body = { ok: true, msg: 'bookId不存在' }
        return false
      }
      if (!formId || formId === 'the formId is a mock one') {
        ctx.body = { ok: true, msg: 'formId不合法' }
        return false
      }
      // 查找当前用户是否已经存在formId
      const formIdRecord = await FormId.findOne({ userid: userid })
      if (formIdRecord) {
        // 数据库中已经存在当前用户的formId记录，只需要更新就好了
        const updateResult = await FormId.update(
          { userid },
          {
            $addToSet: {
              records: {
                bookid: await FormId.transId(bookId),
                value: formId,
                add_time: new Date()
              }
            }
          }
        )
        if (updateResult.ok == 1) {
          ctx.body = { ok: true, msg: '提交formId成功' }
        } else {
          ctx.body = { ok: false, msg: '提交formId失败，数据库更新失败' }
        }
      } else {
        // 数据库中不存在当前用户的formId记录，需要创建一个新的
        const updateResult = await FormId.create({
          userid: await FormId.transId(userid),
          records: [
            {
              bookid: await FormId.transId(bookId),
              value: formId,
              add_time: new Date()
            }
          ]
        })
        if (updateResult.id) {
          ctx.body = { ok: true, msg: '提交formId成功' }
        } else {
          ctx.body = { ok: false, msg: '提交formId失败，新增数据失败' }
        }
      }
    }
  })
}
