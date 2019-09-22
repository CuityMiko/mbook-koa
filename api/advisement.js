import { checkAdminToken } from '../utils'
import { Advisement } from '../models'

export default function(router) {
  /**
   * 前端接口
   * 获取advisement列表
   */
  router.get('/api/front/advisement', async (ctx, next) => {
    const result = await Advisement.findOne({ show: true }, 'type url img_url des')
    ctx.body = { ok: true, msg: '获取advisement成功', data: result }
  })

  /**
   * 后端接口
   * 获取advisement列表
   */
  router.get('/api/backend/advisement', async (ctx, next) => {
    const userid = await checkAdminToken(ctx, next, 'advisement_list')
    if (userid) {
      // 获取url参数
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
      let result = await Advisement.find()
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ create_time: 1 })
      let total = await Advisement.count()
      ctx.body = { ok: true, msg: '获取advisement成功', total: total, list: result }
    }
  })

  /**
   * 后端接口
   * 新增advisement
   */
  router.post('/api/backend/advisement', async (ctx, next) => {
    const userid = await checkAdminToken(ctx, next, 'advisement_add')
    if (userid) {
      let { show, type, url, img_url, des } = ctx.request.body
      let maxPriority = await Advisement.count()
      let result = await Advisement.create({
        priority: maxPriority + 1,
        show,
        type,
        url,
        img_url,
        des,
        create_time: new Date()
      })
      ctx.body = { ok: true, msg: '新增advisement成功', data: result, total: maxPriority + 1 }
    }
  })

  /**
   * 后端接口
   * 修改advisement
   */
  router.patch('/api/backend/advisement/:id', async (ctx, next) => {
    const userid = await checkAdminToken(ctx, next, 'advisement_update')
    if (userid) {
      let id = ctx.params.id
      let result = await Advisement.update({ _id: id }, { $set: ctx.request.body })
      // 如果是显示则将其他都设置为false
      const { show } = ctx.request.body
      if (show) {
        await Advisement.update({ _id: { $ne: id } }, { $set: { show: false } })
      }
      if (result.ok === 1) {
        let newest = await Advisement.findById(id)
        ctx.body = { ok: true, msg: '更新成功', data: newest }
      } else {
        ctx.body = { ok: false, msg: '更新失败', data: result }
      }
    }
  })

  /**
   * 后端接口
   * 删除advisement
   */
  router.delete('/api/backend/advisement/:id', async (ctx, next) => {
    const userid = await checkAdminToken(ctx, next, 'advisement_delete')
    if (userid) {
      let id = ctx.params.id
      let result = await Advisement.remove({ _id: id })
      if (result.result.ok === 1) {
        ctx.body = { ok: true, msg: '删除成功' }
      } else {
        ctx.body = { ok: false, msg: '删除失败', data: result.result }
      }
    }
  })
}
