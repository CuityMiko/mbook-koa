import { FriendHelp, FriendHelpBook, User, Secret } from '../models'
import { checkUserToken, checkAdminToken, tool } from '../utils'
import shortid from 'shortid'

export default function(router) {
  // 开始好友助力
  router.post('/api/friend_help', async (ctx, next) => {
    let userid = await checkUserToken(ctx, next)
    if (!userid) {
      return false
    }
    let { fhbid, source } = ctx.request.body
    if (!fhbid || !source) {
      ctx.body = { ok: false, msg: '参数错误' }
    }
    // 检查fhbid是否存在
    let friendHelpBook = await FriendHelpBook.findById(fhbid)
    if (!friendHelpBook) {
      ctx.body = { ok: false, msg: '找不到此好友助力书籍' }
      return false
    }
    // 检查来源的正确性
    let rightSourceArr = ['activity', 'book_detail', 'reader']
    if (rightSourceArr.indexOf(source) < 0) {
      ctx.body = { ok: false, msg: '来源错误' }
      return false
    }
    // 检测当前用户是否已经对该书籍存在分享，并且该分享尚未完成
    let tmpFriendHelp = await FriendHelp.findOne({ userid, fhbid }, '_id fhcode create_time').populate({
      path: 'fhbid',
      select: 'limit_time'
    })
    let isInvid = false
    let now = new Date()
    if (tmpFriendHelp) {
      let limitTime = tmpFriendHelp.create_time.getTime() + tmpFriendHelp.fhbid.limit_time * 24 * 60 * 60 * 1000
      if (now.getTime() < limitTime) {
        isInvid = true
      }
    }
    if (tmpFriendHelp && isInvid) {
      ctx.body = { ok: true, msg: '已存在该书籍的好友助力', fhcode: tmpFriendHelp.fhcode, need_num: friendHelpBook.need_num }
    } else {
      // 创建friendHelp
      let friendHelp = await FriendHelp.create({
        fhbid: await FriendHelp.transId(fhbid),
        userid: await FriendHelp.transId(userid),
        fhcode: shortid.generate(),
        records: [],
        source,
        success: false,
        create_time: new Date()
      })
      ctx.body = { ok: true, msg: '创建好友助力成功', fhcode: friendHelp.fhcode, need_num: friendHelpBook.need_num }
    }
  })

  // 好友接受助力分享
  router.get('/api/friend_help/accept', async (ctx, next) => {
    let userid = await checkUserToken(ctx, next)
    if (!userid) {
      return false
    }
    let fhcode = ctx.request.query.fhcode
    // 校验fhcode合法性，存在并且未过期
    let friendHelp = await FriendHelp.findOne({ fhcode })
    if (!friendHelp) {
      ctx.body = { ok: false, msg: '参数错误' }
      return false
    }
    if (friendHelp.success) {
      ctx.body = { ok: false, msg: '好友助力已经完成' }
      return false
    }
    if (friendHelp.userid.toString() === userid) {
      ctx.body = { ok: false, msg: '自己不能给自己助力' }
      return false
    }
    // 检验是否已经接受助力了
    let hasAccept = friendHelp.records.some(item => {
      return item.uid.toString() === userid
    })
    if (hasAccept) {
      ctx.body = { ok: false, msg: '您已经接受了该好友助力' }
      return false
    }
    // 是否超时，或者达标
    let friendHelpBook = await FriendHelpBook.findById(friendHelp.fhbid)
    let now = new Date()
    if (friendHelpBook.limit_time && now.getTime() - friendHelp.create_time.getTime() > friendHelpBook.limit_time * 24 * 60 * 60 * 1000) {
      ctx.body = { ok: false, msg: '好友助力超时' }
      return false
    }
    if (friendHelpBook.need_num && friendHelp.records.length >= friendHelpBook.need_num) {
      ctx.body = { ok: false, msg: '好友助力已完成' }
      return false
    }
    // 为好友助力添加记录
    let currentUser = await User.findById(userid)
    let data = {
      uid: currentUser.id,
      name: currentUser.username,
      avatar: currentUser.avatar,
      time: new Date()
    }
    // 判断是否已完成
    let success = false
    if (friendHelpBook.need_num && friendHelp.records.length + 1 === friendHelpBook.need_num) {
      success = true
    }
    // 开始更新
    let updateResult = await FriendHelp.update({ fhcode }, { $addToSet: { records: data }, $set: { success } })
    if (updateResult.ok == 1 && updateResult.nModified == 1) {
      if (success) {
        // 发放完成好友助力的奖励，自动为其解锁该书籍
        console.log('好友助力完成，自动为其解锁该书籍')
        await Secret.create({
          userid: await FriendHelpBook.transId(userid),
          bookid: await FriendHelpBook.transId(friendHelpBook.bookid),
          active: true,
          create_time: new Date()
        })
      }
      ctx.body = { ok: true, msg: '接受好友助力成功' }
    } else {
      ctx.body = { ok: false, msg: '接受好友助力失败' }
    }
  })

  // 小程序端获取好友助力信息
  router.get('/api/friend_help/info', async (ctx, next) => {
    let fhcode = ctx.request.query.fhcode
    if (!fhcode) {
      ctx.body = { ok: false, msg: '参数错误' }
      return false
    }
    let friendHelp = await FriendHelp.findOne({ fhcode })
    if (!friendHelp) {
      ctx.body = { ok: false, msg: '找不到此好友助力信息' }
    }
    // 获取当前分享的用户信息
    let user = await User.findById(friendHelp.userid, 'username avatar')
    // 获取当前分享的书籍信息
    let friendHelpBook = await FriendHelpBook.findById(friendHelp.fhbid).populate({
      path: 'bookid',
      select: '_id name img_url author'
    })
    let now = new Date()
    let limitTime = friendHelpBook.limit_time > 0 ? parseInt(friendHelpBook.limit_time) : 0
    let endDate = new Date(friendHelp.create_time.getTime() + limitTime * 24 * 60 * 60 * 1000)
    ctx.body = {
      ok: true,
      msg: '获取好友助力信息成功',
      data: {
        userid: friendHelp.userid,
        success: friendHelp.success,
        has_finished: friendHelp.records.length,
        create_time: friendHelp.create_time.getTime(),
        left_time: tool.formatDuring(endDate.getTime() - now.getTime()),
        book: {
          id: friendHelpBook.bookid._id,
          need_num: friendHelpBook.need_num,
          limit_time: friendHelpBook.limit_time,
          name: friendHelpBook.bookid.name,
          author: friendHelpBook.bookid.author,
          img_url: friendHelpBook.bookid.img_url
        },
        user: {
          username: user.username,
          avatar: user.avatar
        }
      }
    }
  })

  // 小程序端获取助力记录
  router.get('/api/friend_help/records', async (ctx, next) => {
    let fhcode = ctx.request.query.fhcode
    if (!fhcode) {
      ctx.body = { ok: false, msg: '参数错误' }
      return false
    }
    let friendHelp = await FriendHelp.findOne({ fhcode })
    if (!friendHelp) {
      ctx.body = { ok: false, msg: '找不到此好友助力信息' }
    }
    let arr = []
    friendHelp.records.forEach(item => {
      arr.push({
        name: item.name,
        avatar: item.avatar,
        time: tool.formatTime2(item.time)
      })
    })
    ctx.body = {
      ok: true,
      msg: '获取好友助力信息成功',
      lists: arr
    }
  })
}
