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
           * 连续签到7天 额外获得200书币
           * 连续签到15天 额外获得400书币
           * 连续签到30天 额外获得600书币
           */
          let basePrise = 50
          switch(keep_times){
            case 3:
              basePrise += 100
              break
            case 7:
              basePrise += 200
              break
            case 15:
              basePrise += 400
              break
            case 30:
              basePrise += 600
              break
          }
          ctx.body = { ok: true, msg: '签到成功', keep_times: keep_times }
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
          ctx.body = { ok: true, msg: '保存签到记录失败' }
        }
      }
    }else{
      ctx.body = { ok: false, msg: '无效token' }
    }
  })
}
