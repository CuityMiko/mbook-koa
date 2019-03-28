import { Secret, User, Book, Setting } from '../models'
import shortid from 'shortid'
import moment from 'moment'
import { checkAdminToken, checkUserToken, debug, reportError } from '../utils'
import user from './user'

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
      const thisUser = await User.findById(userid, '_id username')
      if (!thisUser) {
        ctx.body = { ok: false, msg: '用户不存在' }
        return false
      }
      const thisBook = await Book.findById(bookid, '_id name')
      if (!thisBook) {
        ctx.body = { ok: false, msg: '书籍不存在' }
        return false
      }
      const secretReg = /^[A-Za-z0-9_\-]{7,14}$/
      if (!secretReg.test(secret)) {
        ctx.body = { ok: false, msg: '粉丝凭证错误' }
        return false
      }
      const thisBook2 = await Book.findOne({ _id: bookid, secret }, '_id')
      if (!thisBook2) {
        ctx.body = { ok: false, msg: '粉丝凭证错误' }
        return false
      }
      const thisSecret = await Secret.create({
        userid: await Secret.transId(userid),
        bookid: await Secret.transId(bookid),
        active: true,
        create_time: new Date()
      })
      if (thisSecret) {
        // 发送秘钥解锁成的通知，延迟三分钟后执行
        setTimeout(() => {
          User.sendMessage(
            userid,
            'secret',
            {
              keyword1: { value: thisUser.username },
              keyword2: { value: thisBook.name },
              keyword3: { value: moment().format('YYYY年MM月DD日 HH:mm:ss') },
              keyword4: { value: '你已经成功解锁书籍--《' + thisBook.name + '》，点击卡片开始阅读书籍吧~' }
            },
            { bookid }
          )
            .then(res => {
              if (res.ok) {
                console.log('解锁成功消息发送成功!')
              } else {
                console.log('解锁成功消息发送失败', res.msg)
                reportError('解锁成功消息发送失败', { extra: { context: ctx } })
              }
            })
            .catch(err => {
              console.log('解锁成功消息发送失败', err)
              reportError('解锁成功消息发送失败', { extra: { context: ctx, err } })
            })
        }, 0)
        ctx.body = { ok: true, msg: '解锁成功' }
      } else {
        ctx.body = { ok: false, msg: '解锁失败' }
      }
    }
  })

  // 管理员分享的时候预创建一个未解锁的secret
  router.post('/api/secret/pre_create', async (ctx, next) => {
    const userid = await checkUserToken(ctx, next, 'user_list')
    if (userid) {
      // 校验当前用户是否存在分享白名单里
      const shareWhite = await Setting.findOne({ key: 'share_white_list' }, 'value')
      if (!shareWhite) {
        ctx.body = { ok: false, msg: '暂无权限' }
        return
      }
      const shareWhiteList = shareWhite.value
      if (shareWhiteList.indexOf(userid) < 0) {
        ctx.body = { ok: false, msg: '暂无权限' }
        return
      }
      // 创建secret
      const bookid = ctx.request.body.bookid
      if (!bookid) {
        ctx.body = { ok: false, msg: '缺乏bookid参数' }
        return
      }
      const book = await Book.findById(bookid, '_id')
      if (!book) {
        ctx.body = { ok: false, msg: 'bookid参数错误' }
        return
      }
      const newSecret = await Secret.create({ bookid: await Secret.transId(bookid), active: false, create_time: new Date() })
      if (newSecret._id) {
        ctx.body = { ok: true, msg: '创建预分享密钥成功', data: newSecret._id }
      } else {
        ctx.body = { ok: false, msg: '创建密钥失败' }
      }
    }
  })

  // 打开预分享密钥, 为用户自动解锁书籍函数
  router.post('/api/secret/pre_secret_open', async (ctx, next) => {
    const userid = await checkUserToken(ctx, next, 'user_list')
    if (userid) {
      const { pre_secret } = ctx.request.body
      if (!pre_secret) {
        ctx.body = { ok: false, msg: '缺乏pre_secret参数' }
        return false
      }
      const thisUser = await User.findById(userid, '_id username')
      if (!thisUser) {
        ctx.body = { ok: false, msg: '用户不存在' }
        return false
      }
      const thisSecret = await Secret.findById(pre_secret, { active: false }, '_id bookid')
      if (!thisSecret) {
        ctx.body = { ok: false, msg: '预分享密钥无效或者已经被使用' }
        return false
      }
<<<<<<< Updated upstream
      const thisBook = await Book.findById(thisSecret.bookid.toString(), 'name')
      // 检查是否预分享密钥已经使用过了
      const updateResult = await Secret.update(
        { _id: pre_secret },
        {
          $set: {
            userid: await Secret.transId(userid),
            active: true
          }
        }
      )
      if (updateResult.ok ===1) {
=======

      if (!await Secret.findOne({ userid, bookid })) {
        const thisSecret = await Secret.create({
          userid: await Secret.transId(userid),
          bookid: await Secret.transId(bookid),
          active: true,
          create_time: new Date()
        })
        if (thisSecret) {
>>>>>>> Stashed changes
        // 发送秘钥解锁成的通知，延迟三分钟后执行
        setTimeout(() => {
          User.sendMessage(
            userid,
            'secret',
            {
              keyword1: { value: thisUser.username },
              keyword2: { value: thisBook.name },
              keyword3: { value: moment().format('YYYY年MM月DD日 HH:mm:ss') },
              keyword4: { value: '你已经成功解锁书籍--《' + thisBook.name + '》，点击卡片开始阅读书籍吧~' }
            },
            { bookid: thisBook._id }
          )
            .then(res => {
              if (res.ok) {
                console.log('解锁成功消息发送成功!')
              } else {
                console.log('解锁成功消息发送失败', res.msg)
              }
            })
            .catch(err => {
              console.log('解锁成功消息发送失败', err)
            })
        }, 0)
        ctx.body = { ok: true, msg: '解锁成功' }
      } else {
        ctx.body = { ok: false, msg: '解锁失败' }
      }
    }
  })
}
