import { Secret, User, Book } from '../models'
import shortid from 'shortid'
import { checkAdminToken, checkUserToken } from '../utils'

export default function(router) {
  router.get('/api/secret', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'user_list')
    if (userid) {
      let { page, limit, search } = ctx.request.query
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
      if (!search) {
        search = ''
      }
      const total = await Secret.count().populate({
        path: 'userid',
        select: 'username',
        match: {
          username: new RegExp(search, 'i')
        }
      })
      const users = await Secret.find()
        .populate({
          path: 'userid',
          select: 'username',
          match: {
            username: new RegExp(search, 'i')
          }
        })
        .populate({
          path: 'bookid',
          select: 'name'
        })
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ active: 1, create_time: -1 })
      ctx.body = { ok: true, msg: '获取秘钥列表成功', list: users, total }
    }
  })

  router.post('/api/secret', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'user_list')
    if (userid) {
      let { userid, bookid } = ctx.request.body
      // 校验id合法性
      const thisUser = await User.findById(userid, '_id')
      if (!thisUser) {
        ctx.body = { ok: false, msg: '用户不存在' }
        return false
      }
      const thisBook = await Book.findById(bookid, '_id')
      if (!thisBook) {
        ctx.body = { ok: false, msg: '书籍不存在' }
        return false
      }
      const newSecret = await Secret.create({
        userid: await Secret.transId(userid),
        bookid: await Secret.transId(bookid),
        secret: shortid.generate(),
        active: false,
        create_time: new Date()
      })
      ctx.body = { ok: true, msg: '创建秘钥成功', data: newSecret }
    }
  })

  router.put('/api/secret/:id', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'user_list')
    if (userid) {
      let { userid, bookid, active, secret } = ctx.request.body
      let id = ctx.params.id
      // 校验id合法性
      const thisUser = await User.findById(userid, '_id')
      if (!thisUser) {
        ctx.body = { ok: false, msg: '用户不存在' }
        return false
      }
      const thisBook = await Book.findById(bookid, '_id')
      if (!thisBook) {
        ctx.body = { ok: false, msg: '书籍不存在' }
        return false
      }
      const thisSecret = await Secret.findById(id, '_id')
      if (!thisSecret) {
        ctx.body = { ok: false, msg: '秘钥不存在' }
        return false
      }
      const secretReg = /^[A-Za-z0-9_\-]{7,14}$/
      if (!secretReg.test(secret)) {
        ctx.body = { ok: false, msg: '秘钥格式错误' }
        return false
      }
      const updateResult = await Secret.update(
        { _id: id },
        {
          $set: {
            userid: await Secret.transId(userid),
            bookid: await Secret.transId(bookid),
            secret,
            active: !!active
          }
        }
      )
      if (updateResult.ok === 1) {
        ctx.body = { ok: true, msg: '更新秘钥成功' }
      } else {
        ctx.body = { ok: false, msg: '更新秘钥失败' }
      }
    }
  })

  router.delete('/api/secret/:id', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'user_list')
    if (userid) {
      let id = ctx.params.id
      const thisSecret = await Secret.findById(id, '_id')
      if (!thisSecret) {
        ctx.body = { ok: false, msg: '秘钥不存在' }
        return false
      }
      await Secret.remove({
        _id: id
      })
      ctx.body = { ok: true, msg: '删除秘钥成功' }
    }
  })

  router.get('/api/secret/open', async (ctx, next) => {
    let userid = await checkUserToken(ctx, next, 'user_list')
    if (userid) {
      let bookid = ctx.request.query.bookid
      let secret = ctx.request.query.secret
      const thisBook = await Book.findById(bookid, '_id')
      if (!thisBook) {
        ctx.body = { ok: false, msg: '书籍不存在' }
        return false
      }
      const secretReg = /^[A-Za-z0-9_\-]{7,14}$/
      if (!secretReg.test(secret)) {
        ctx.body = { ok: false, msg: '秘钥错误' }
        return false
      }
      const thisBook2 = await Book.findOne({ _id: bookid, secret }, '_id')
      if (!thisBook2) {
        ctx.body = { ok: false, msg: '秘钥错误' }
        return false
      }
      const thisSecret = await Secret.create({
        userid: await Secret.transId(userid),
        bookid: await Secret.transId(bookid),
        active: true,
        create_time: new Date()
      })
      if (thisSecret) {
        ctx.body = { ok: true, msg: '解锁成功' }
      } else {
        ctx.body = { ok: false, msg: '解锁失败' }
      }
    }
  })
}
