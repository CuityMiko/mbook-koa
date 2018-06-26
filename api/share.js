import { checkAdminToken, checkUserToken, tool } from '../utils'
import { Share, User, Setting } from '../models'
import shortid from 'shortid'
import moment from 'moment'

export default function(router) {
  // 获取用户的分享信息
  router.get('/api/share/info', async (ctx, next) => {
    let userid = await checkUserToken(ctx, next)
    if (userid) {
      // 查询当前用户的邀请信息，如果找不到则创建一个
      let hisShareInfo = await Share.findOne({ userid })
      if (!hisShareInfo) {
        const code = shortid.generate()
        hisShareInfo = await Share.create({
          userid: await Share.transId(userid),
          code,
          award_records: [],
          share_records: [],
          accept_records: [],
          create_time: new Date()
        })
      }
      // 统计用户邀请信息，今日邀请人数，以及累计邀请人数，累计获得书书币数
      const nowDateStr = moment().format('YYYY/MM/DD')
      const startTime = new Date(nowDateStr + ' 00:00:00')
      const endTime = new Date(nowDateStr + ' 24:00:00')
      let todayInviteNum = 0
      let totalInviteNum = 0
      let todayAwardNum = 0
      let totalAwardNum = 0
      let users = []
      hisShareInfo.accept_records.forEach(item => {
        const time = item.accept_time.getTime()
        if (time >= startTime.getTime() && time <= endTime.getTime()) {
          todayInviteNum++
        }
        const uid = item.uid.toString()
        if (users.indexOf(uid) < 0) {
          users.push(uid)
          totalInviteNum++
        }
      })
      hisShareInfo.award_records.forEach(item => {
        const time = item.award_time.getTime()
        if (time >= startTime.getTime() && time <= endTime.getTime()) {
          todayAwardNum += item.amount
        }
        totalAwardNum += item.amount
      })
      // 获取设置中的分享设置
      const shareSetting = await Setting.getSetting('share')
      const wxcode = await Setting.getSetting('wxcode')
      ctx.body = {
        ok: true,
        msg: '获取分享信息成功',
        shareSetting,
        shareInfo: {
          todayAwardNum,
          todayInviteNum,
          totalAwardNum,
          totalInviteNum
        },
        wxcode,
        code: hisShareInfo.code
      }
    }
  })

  // 更新分享记录，在每次被邀请用户登录之后
  router.get('/api/share/update', async (ctx, next) => {
    let userid = await checkUserToken(ctx, next)
    if (userid) {
      const shareId = ctx.request.query.share_id
      const reg = /^[A-Za-z0-9-]+_\d+$/
      if (shareId && reg.test(shareId)) {
        const code = shareId.split('_')[0]
        const time = new Date(parseInt(shareId.split('_')[1]))
        const thisShareLog = await Share.findOne({ code })
        if (thisShareLog) {
          // 限制自己不能邀请自己
          if (thisShareLog.userid.toString() !== userid) {
            const now = new Date()
            if (now.getTime() - time.getTime() < 24 * 60 * 60 * 1000) {
              // 判断当前用户今天是否已经被别的用户邀请过了
              const nowDateStr = moment().format('YYYY/MM/DD')
              const startTime = new Date(nowDateStr + ' 00:00:00')
              const endTime = new Date(nowDateStr + ' 24:00:00')
              const hasInviteLog = await Share.find({ 'accept_records.uid': userid, 'accept_records.accept_time': { $gte: startTime, $lte: endTime } }, '_id accept_records')
              const hasBeInvited = hasInviteLog.some(item => {
                return item.accept_records.length > 0
              })
              // 新增分享记录
              await Share.update(
                { code },
                {
                  $addToSet: {
                    accept_records: {
                      uid: await Share.transId(userid),
                      accept_time: now
                    }
                  }
                }
              )
              if (hasBeInvited) {
                ctx.body = { ok: false, msg: '您今天已经接受过邀请了' }
              } else {
                // 分发奖励
                const acceptAward = await User.addAmount(userid, 15, '接收他人邀请奖励')
                const launchAward = await User.addAmount(thisShareLog.userid.toString(), 15, '邀请他人登录奖励')
                if (acceptAward && launchAward) {
                  // 新增奖励记录
                  await Share.update(
                    { userid },
                    {
                      $addToSet: {
                        award_records: {
                          name: '接受邀请奖励',
                          amount: 15,
                          award_time: new Date()
                        }
                      }
                    }
                  )
                  await Share.update(
                    { code },
                    {
                      $addToSet: {
                        award_records: {
                          name: '邀请别人奖励',
                          amount: 15,
                          award_time: new Date()
                        }
                      }
                    }
                  )
                  // 使用微信小程序模板消息通知用户邀请他人成功
                  const currentUser = await User.findById(userid, 'username')
                  User.sendMessage(thisShareLog.userid.toString(), 'accept', {
                    keyword1: {
                      value: currentUser.username
                    },
                    keyword2: {
                      value: '您的好友--' + currentUser.username + '已经接受您的阅读邀请，您获得15书币。'
                    },
                    keyword3: {
                      value: moment().format('YYYY年MMMDo h:mm:ss')
                    }
                  })
                    .then(res => {
                      if (res.ok) {
                        console.log('消息发送成功!')
                      } else {
                        console.error(res.msg)
                        console.err('消息发送失败!')
                      }
                    })
                    .catch(err => {
                      console.err(err)
                      console.err('消息发送失败!')
                    })
                  ctx.body = { ok: true, msg: '成功接受邀请，奖励已发放' }
                } else {
                  ctx.body = { ok: false, msg: '成功接口邀请，奖励发放失败' }
                }
              }
            } else {
              ctx.body = { ok: false, msg: '邀请已经过期' }
            }
          } else {
            ctx.body = { ok: false, msg: '参数错误，自己不能邀请自己', inviteself: true }
          }
        } else {
          ctx.body = { ok: false, msg: '参数错误' }
        }
      } else {
        ctx.body = { ok: false, msg: '参数错误' }
      }
    }
  })
}
