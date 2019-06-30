import { Notice } from '../models'
import moment from 'moment'
import { checkUserToken, checkAdminToken } from '../utils'

export default function(router) {

  // 前端获取通知列表
  router.get('/api/wxapp/notice', async (ctx, next) => {
    let userid = await checkUserToken(ctx, next, 'notice_get')
    if (userid) {
      let { page } = ctx.request.query;
      if (page) {
        page = parseInt(page)
      } else {
        page = 1
      }
      // const startDate = new Date(moment().subtract(14, 'days'))
      // const endDate = new Date()
      const orParams = []
      orParams.push({ user: {$regex: `.*${userid}.*`} })
      orParams.push( { user: 'all' })
      const userAgent = ctx.request.headers['user-agent']
      if (/Android/i.test(userAgent)) {
        orParams.push( { user: 'android' })
      }
      if (/iPhone|iPad|iPod/i.test(userAgent)) {
        orParams.push( { user: 'ios' })
      }
      const total = await Notice.count({
        $or: orParams,
        // create_time: { $gt: startDate, $lt: endDate }
      })
      const notices = await Notice.find({
        $or: orParams,
        // create_time: { $gt: startDate, $lt: endDate }
      })
      .skip((page - 1) * 10)
      .limit(10)
      .sort({ create_time: -1 })
      ctx.body = { ok: true, msg: '获取通知成功', list: notices, total }
    }
  })

  // 前端获取通知详情
  router.get('/api/wxapp/notice/:id/detail', async (ctx, next) => {
    let userid = await checkUserToken(ctx, next, 'notice_get')
    if (userid) {
      // 获取url参数
      const id = ctx.params.id
      const thisNotice = await Notice.findById(id)
      if (thisNotice) {
        ctx.body = { ok: true, msg: '获取通知详情成功', data: thisNotice }
      } else {
        ctx.body = { ok: false, msg: '获取通知详情失败' }
      }
    }
  })

  // 后台获取通知列表
  router.get('/api/notice', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'notice_query')
    if (userid) {
      // 获取url参数
      let { page, limit } = ctx.request.query
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
      const total = await Notice.count({ type: 'system' })
      const notices = await Notice.find({ type: 'system' })
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ create_time: -1 })
      ctx.body = { ok: true, msg: '获取通知成功', list: notices, total }
    }
  })

  // 后台获取通知详情
  router.get('/api/notice/:id/detail', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'notice_query')
    if (userid) {
      // 获取url参数
      const id = ctx.params.id
      const thisNotice = await Notice.findById(id)
      if (thisNotice) {
        ctx.body = { ok: true, msg: '获取通知详情成功', data: thisNotice }
      } else {
        ctx.body = { ok: false, msg: '获取通知详情失败' }
      }
    }
  })

  // 后台新增通知  
  router.post('/api/notice', async (ctx, next) => {
    const userid = await checkAdminToken(ctx, next)
    if (userid) {
      const { title='', description='', content='', preview='', users='' } = ctx.request.body
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
        preview,
        create_time: new Date()
      })
      ctx.body = { ok: true, data: notice, msg: '创建通知成功' }
    }
  })

  // 后台修改通知
  router.put('/api/notice/:id', async (ctx, next) => {
    const userid = await checkAdminToken(ctx, next)
    if (userid) {
      const id = ctx.params.id
      if (!id) {
        ctx.body = { ok: false, msg: '参数错误' }
        return
      }
      const { title='', description='', content='', preview='', users='' } = ctx.request.body
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
      const thisNotice = await Notice.findById(id, '_id')
      if (!thisNotice) {
        ctx.body = { ok: false, msg: '找不到该通知' }
      }

      const updateResult = await Notice.update(
        { _id: id },
        {
          $set: {
            title,
            description,
            content,
            preview,
            user: users,
          }
        }
      )
      if (updateResult.ok) {
        ctx.body = { ok: true, msg: '更新通知成功' }
      } else {
        ctx.body = { ok: false, msg: '更新通知失败' }
      }
    }
  })

  // 后台新增通知
  router.delete('/api/notice/:id', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'setting_delete')
    if (userid) {
      const id = ctx.params.id
      if (id) {
        const thisNotice = await Notice.findById(id, '_id')
        if (thisNotice) {
          let deleteResult = await Notice.remove({ _id: id })
          if (deleteResult.result.ok) {
            ctx.body = { ok: true, msg: '删除通知成功' }
          } else {
            ctx.body = { ok: false, msg: '删除通知失败' }
          }
        } else {
          ctx.body = { ok: false, msg: '找不到该通知' }
        }
      } else {
        ctx.body = { ok: false, msg: '参数错误' }
      }
    }
  })
}
