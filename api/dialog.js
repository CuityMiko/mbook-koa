import { Dialog } from '../models'
import { checkUserToken, checkAdminToken } from '../utils'

export default function(router) {
  // 后台管理新增弹窗
  router.post('/api/dialog', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'dialog_add')
    if (userid) {
      // 参数检查
      let { type, description, start_date, end_date, data } = ctx.request.body
      if (!type) {
        ctx.body = { ok: false, msg: '弹窗类型不能为空' }
        return false
      }
      if (!description) {
        ctx.body = { ok: false, msg: '弹窗描述不能为空' }
        return false
      }
      if (!start_date) {
        ctx.body = { ok: false, msg: '弹窗生效时间不能为空' }
        return false
      }
      if (!end_date) {
        ctx.body = { ok: false, msg: '弹窗失效时间不能为空' }
        return false
      }
      if (!data) {
        ctx.body = { ok: false, msg: '弹窗内容时间不能为空' }
        return false
      }
      try {
        data = JSON.parse(data)
      } catch(err) {
        ctx.body = { ok: false, msg: '弹窗内容不合法', err: err.toString() }
        return false
      }

      // 新增数据
      const dialog = await Dialog.create({
        type,
        description,
        data,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        create_time: new Date()
      })

      if (dialog.id) {
        ctx.body = { ok: true, msg: '创建弹窗成功', data: dialog }
      } else {
        ctx.body = { ok: false, msg: '创建弹窗失败', data: dialog }
      }
    }
  })

  // 后台管理新增弹窗
  router.put('/api/dialog/:id', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'dialog_update')
    if (userid) {
      // 参数检查
      let dialog_id = ctx.params.id
      let { type, description, start_date, end_date, data } = ctx.request.body
      try {
        data = JSON.parse(data)
      } catch(err) {
        ctx.body = { ok: false, msg: '弹窗内容不合法', err: err.toString() }
        return false
      }

      // 整理需要更新的参数
      let updateData = {}
      if (type) {
        updateData.type = type
      }
      if (description) {
        updateData.description = description
      }
      if (start_date) {
        updateData.start_date = start_date
      }
      if (end_date) {
        updateData.end_date = end_date
      }
      if (data) {
        updateData.data = data
      }
      
      // 新增数据
      const updateResult = await Dialog.update({ id: dialog_id }, { $set: updateData })
      if (updateResult.ok == 1) {
        ctx.body = { ok: true, msg: '更新弹窗成功' }
      } else {
        ctx.body = { ok: false, msg: '更新弹窗失败', err: updateData }
      }
    }
  })

  // 后台管理删除弹窗
  router.delete('/api/dialog/:id', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'dialog_delete')
    if (userid) {
      let id = ctx.params.id
      const thisDialog = await Dialog.findById(id, '_id')
      if (!thisDialog) {
        ctx.body = { ok: false, msg: '弹窗不存在' }
        return false
      }
      await Dialog.remove({
        _id: id
      })
      ctx.body = { ok: true, msg: '删除弹窗成功' }
    }
  })

  // 后台管理获取弹窗列表
  router.get('/api/dialog', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'dialog_list')
    if (userid) {
      // 参数格式化
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
 
      // 查询记录
      const total = await Dialog.count()
      const dialogs = await Dialog.find()
        .sort({ create_time: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
      ctx.body = { ok: true, total, list: dialogs, msg: '获取弹窗列表成功' }
    }
  })

  // 小程序端获取弹窗列表
  router.get('/api/wxapp/dialog', async (ctx, next) => {
    let userid = await checkUserToken(ctx, next, 'dialog_wxapp')
    if (userid) {
      let now = new Date()
      let dialogs = await Dialog.find({
        start_date: {
          $lt: now
        },
        end_date: {
          $gte: now
        }
      })

      // 整理dialogs的格式
      let fixedDialog = {}
      let indexDialog = {}
      let redpockDialog = {}
      for( let i=0; i<dialogs.length; i++) {
        if (dialogs[i].type === 'fixed-btn' && JSON.stringify(fixedDialog) === '{}') {
          fixedDialog = dialogs[i]
        }
        if (dialogs[i].type === 'index-dialog' && JSON.stringify(indexDialog) === '{}') {
          indexDialog = dialogs[i]
        }
        if (dialogs[i].type === 'redpock' && JSON.stringify(redpockDialog) === '{}') {
          redpockDialog = dialogs[i]
        }
      }
      ctx.body = { ok: true, dialog: {
        'fixed-btn': fixedDialog,
        'index-dialog': indexDialog,
        'redpock': redpockDialog
      }, msg: '获取弹窗列表成功' }
    }
  })
}
