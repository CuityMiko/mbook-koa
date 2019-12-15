import moment from 'moment'
import { Attendance, User } from '../models'
import { checkUserToken, continueDays } from '../utils'

export default function(router) {
  router.get('/api/attendance', async (ctx, next) => {
    // 获取用户信息
    let userid = await checkUserToken(ctx, next)
    if (userid) {
      // 查找是否存在签到记录
      let hisAttendance = await Attendance.findOne({ userid: userid })
      let nowDate = moment().format('YYYY/MM/DD')
      if (hisAttendance) {
        // 计算连续签到次数
        let keep_times = continueDays(hisAttendance.records)
        let updateResult = await Attendance.update({ userid: userid }, { $addToSet: { records: moment().format('YYYY/MM/DD') }, keep_times: keep_times })
        if (updateResult.ok == 1 && updateResult.nModified == 1) {
          hisAttendance = await Attendance.findOne({ userid: userid })
          keep_times = continueDays(hisAttendance.records)
          /**
           * 发放奖励
           * 每天签到成功可以领取50书币
           * 连续签到3天 额外获得100书币
           * 连续签到7天 额外获得150书币
           * 连续签到15天 额外获得200书币
           * 连续签到30天 额外获得300书币
           */
          let basePrise = 15
          switch (keep_times) {
            case 3:
              basePrise += 30
              break
            case 7:
              basePrise += 45
              break
            case 15:
              basePrise += 60
              break
            case 30:
              basePrise += 90
              break
          }
          // 修改用户的书币数
          let changeResult = await User.addAmount(userid, basePrise, '发放签到奖励')
          if (changeResult) {
            // 获取当前用户的签到排名
            let totalCount = await Attendance.distinct('userid')
            let myCount = await Attendance.distinct('userid', { keep_times: { $gt: keep_times } })
            ctx.body = {
              ok: true,
              msg: '签到成功',
              keep_times: keep_times,
              total: totalCount.length,
              records: hisAttendance.records,
              present: 100 - parseInt((myCount.length / totalCount.length) * 100)
            }
          } else {
            // 回退签到记录
            let hisNewAttendance = await Attendance.findOne({ userid: userid })
            let records = hisNewAttendance.records.filter(item => {
              return item !== nowDate
            })
            let newUpdateResult = await Attendance.update({ userid: userid }, { $set: { records: records } })
            ctx.body = { ok: false, msg: '发放签到奖励失败' }
          }
        } else {
          ctx.body = { ok: false, msg: '您已经签到过了' }
        }
      } else {
        let thisAttendance = await Attendance.create({
          userid: await Attendance.transId(userid),
          keep_times: 1,
          records: [moment().format('YYYY/MM/DD')],
          create_time: new Date()
        })
        if (thisAttendance) {
          // 修改用户的书币数
          let basePrise = 5
          let changeResult = await User.addAmount(userid, basePrise, '发放签到奖励')
          if (changeResult) {
            let totalCount = await Attendance.distinct('userid')
            let myCount = await Attendance.distinct('userid', { keep_times: { $gt: 1 } })
            ctx.body = { ok: true, msg: '签到成功', keep_times: 1, total: totalCount.length, records: thisAttendance.records, present: 100 - parseInt((myCount.length / totalCount.length) * 100) }
          } else {
            let hisNewAttendance = await Attendance.findOne({ userid: userid })
            let records = hisNewAttendance.records.filter(item => {
              return item !== nowDate
            })
            let newUpdateResult = await Attendance.update({ userid: userid }, { $set: { records: records } })
            ctx.body = { ok: false, msg: '发放签到奖励失败' }
          }
        } else {
          ctx.body = { ok: false, msg: '保存签到记录失败' }
        }
      }
    }
  })

  // 获取我的签到信息
  router.get('/api/attendance/me', async (ctx, next) => {
    // 获取用户信息
    // 获取用户信息
    let userid = await checkUserToken(ctx, next)
    if (userid) {
      let hisAttendance = await Attendance.findOne({ userid: userid })
      let totalCount = await Attendance.distinct('userid')
      if (hisAttendance) {
        let myCount = await Attendance.distinct('userid', { keep_times: { $gt: hisAttendance.keep_times } })
        let nowDate = moment().format('YYYY/MM/DD')
        let hasDone = hisAttendance.records.some(item => {
          return nowDate === item
        })
        ctx.body = {
          ok: true,
          msg: '获取签到信息成功',
          has_done: hasDone,
          keep_times: hisAttendance.keep_times,
          records: hisAttendance.records,
          total: totalCount.length,
          present: 100 - parseInt((myCount.length / totalCount.length) * 100)
        }
      } else {
        ctx.body = { ok: true, msg: '没有签到记录', keep_times: 0, records: [], total: totalCount, present: 0 }
      }
    }
  })
}
