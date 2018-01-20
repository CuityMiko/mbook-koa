import moment from 'moment'
import { Attendance, User } from '../models'
import { jwtVerify, tool } from '../utils'

export default function (router) {
  router.get('/api/attendance', async (ctx, next) => {
    // 获取用户信息
    let token = ctx.header.authorization.split(' ')[1]
    let payload = await jwtVerify(token)
    if(payload && payload.userid){
      // 查找是否存在签到记录
      let hisAttendance = await Attendance.findOne({ userid: payload.userid })
      if(hisAttendance){
        // 计算连续签到次数
        let nowDate = moment().format('YYYY/MM/DD')
        let keep_times = tool.continueDays(hisAttendance.records)
        let updateResult = await Attendance.update({userid: payload.userid}, {'$addToSet': {records: moment().format('YYYY/MM/DD')}, keep_times: keep_times})
        if(updateResult.ok == 1 && updateResult.nModified == 1){
          /**
           * 发放奖励
           * 每天签到成功可以领取50书币
           * 连续签到3天 额外获得100书币
           * 连续签到7天 额外获得150书币
           * 连续签到15天 额外获得200书币
           * 连续签到30天 额外获得300书币
           */
          let basePrise = 50
          switch(keep_times){
            case 3:
              basePrise += 100
              break
            case 7:
              basePrise += 150
              break
            case 15:
              basePrise += 200
              break
            case 30:
              basePrise += 300
              break
          }
          // 修改用户的书币数
          let changeResult = await User.addAmount(payload.userid, basePrise)
          if(changeResult){
            // 获取当前用户的签到排名
            let totalCount = await Attendance.distinct('userid')
            let myCount = await Attendance.distinct('userid', { keep_times: { $gt: keep_times } })
            ctx.body = { ok: true, msg: '签到成功', keep_times: keep_times, total: totalCount.length, present: 100 - parseInt((myCount.length/totalCount.length)*100) }
          }else{
            // 回退签到记录
            let hisNewAttendance = await Attendance.findOne({ userid: payload.userid })
            let records = hisAttendance.records.filter(item => {
              return item !== nowDate
            })
            let newUpdateResult = await Attendance.update({userid: payload.userid}, { $set: { records: records } })
            ctx.body = { ok: false, msg: '发放签到奖励失败' }
          }
        }else{
          ctx.body = { ok: false, msg: '您已经签到过了' }
        }
      }else{
        let thisAttendance = await Attendance.create({
          userid: await Attendance.transId(payload.userid),
          keep_times: 1,
          records: [moment().format('YYYY/MM/DD')],
          create_time: new Date()
        })
        if(thisAttendance){
          ctx.body = { ok: true, msg: '签到成功' }
        }else{
          ctx.body = { ok: false, msg: '保存签到记录失败' }
        }
      }
    }else{
      ctx.body = { ok: false, msg: '无效token' }
    }
  })

  // 获取我的签到信息
  router.get('/api/attendance/me', async (ctx, next) => {
    // 获取用户信息
    let token = ctx.header.authorization.split(' ')[1]
    let payload = await jwtVerify(token)
    if(payload && payload.userid){
      let hisAttendance = await Attendance.findOne({ userid: payload.userid })
      let totalCount = await Attendance.distinct('userid')
      if(hisAttendance){
        let myCount = await Attendance.distinct('userid', { keep_times: { $gt: hisAttendance.keep_times } })
        ctx.body = { ok: true, msg: '获取签到信息成功', keep_times: hisAttendance.keep_times, records: hisAttendance.records, total: totalCount.length, present: 100 - parseInt((myCount.length/totalCount.length)*100) }
      }else{
        ctx.body = { ok: true, msg: '没有签到记录', keep_times: 0, records: [], total:  totalCount, present: 0 }
      }
    }else{
      ctx.body = { ok: false, msg: '无效token' }
    }
  })
}
