import { checkAdminToken } from '../utils'
import { Setting } from '../models'

export default function(router) {
  // 小程序获取配置项接口
  router.get('/api/get_setting_items', async (ctx, next) => {
    const items = ctx.request.query.items
    const itemArray = items.split('|')
    let result = {}
    for (let i = 0; i < itemArray.length; i++) {
      if (itemArray[i]) {
        result[itemArray[i]] = (await Setting.getSetting(itemArray[i])) || ''
      }
    }
    ctx.body = { ok: true, msg: '获取配置项成功', items: result }
  })

  // 后台获取所有的设置项
  router.get('/api/setting', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'setting_update')
    if (userid) {
      // 获取url参数
      let { page, limit } = ctx.request.query
      // format page and limit
      if (page) {
        page = parseInt(page)
      } else {
        page = 1
      }
      if (limit) {
        limit = parseInt(limit)
      } else {
        limit = 10
      }
      const total = await Setting.count()
      const settings = await Setting.find({})
        .skip((page - 1) * limit)
        .limit(limit)
      ctx.body = { ok: true, msg: '获取设置项成功', list: settings, total }
    }
  })

  // 后台修改设置项
  router.put('/api/setting/:id', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'setting_update')
    if (userid) {
      const id = ctx.params.id
      const { key, value, name, des } = ctx.request.body
      if (id) {
        const thisSetting = await Setting.findById(id, '_id')
        if (thisSetting) {
          const updateResult = await Setting.update(
            { _id: id },
            {
              $set: {
                key,
                value,
                name,
                des
              }
            }
          )
          if (updateResult.ok) {
            ctx.body = { ok: true, msg: '更新设置成功' }
          } else {
            ctx.body = { ok: false, msg: '更新设置失败' }
          }
        } else {
          ctx.body = { ok: false, msg: '找不到该设置' }
        }
      } else {
        ctx.body = { ok: false, msg: '参数错误' }
      }
    }
  })

  // 后台新增设置项
  router.post('/api/setting', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'setting_add')
    if (userid) {
      const { key, value, name, des } = ctx.request.body
      if (key) {
        const newSetting = await Setting.create({
          key,
          value,
          name,
          des,
          create_time: Date.now()
        })
        if (newSetting) {
          ctx.body = { ok: true, msg: '新增设置成功' }
        } else {
          ctx.body = { ok: false, msg: '新增设置失败' }
        }
      } else {
        ctx.body = { ok: false, msg: '参数错误' }
      }
    }
  })

  // 后台新增设置项
  router.delete('/api/setting/:id', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'setting_delete')
    if (userid) {
      const id = ctx.params.id
      if (id) {
        const thisSetting = await Setting.findById(id, '_id')
        if (thisSetting) {
          let deleteResult = await Setting.remove({ _id: id })
          if (deleteResult.result.ok) {
            ctx.body = { ok: true, msg: '删除设置成功' }
          } else {
            ctx.body = { ok: false, msg: '删除设置失败' }
          }
        } else {
          ctx.body = { ok: false, msg: '找不到该设置' }
        }
      } else {
        ctx.body = { ok: false, msg: '参数错误' }
      }
    }
  })
}
