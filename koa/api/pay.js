import { Pay, Good, User } from '../models'
import { createUnifiedOrder } from '../utils/weixin'
import moment from 'moment'

export default function (router) {
  router.post('/api/pay', async (ctx, next) => {
    let { chargeid, pay_money, yuebi_num } = ctx.request.body
    let payload = await jwtVerify(ctx.header.authorization.split(' ')[1])
    if(payload && payload.userid){
      // 查询得到用户的openid
      let thisUser = await User.findById(payload.userid)
      // 参数验证
      if(!chargeid){
        ctx.body = { ok: false, msg: '缺乏chargeid参数' }
        await next()
        return
      }
      if(!pay_money){
        ctx.body = { ok: false, msg: '缺乏pay_money参数' }
        await next()
        return
      }
      if(!yuebi_num){
        ctx.body = { ok: false, msg: '缺乏yuebi_num参数' }
        await next()
        return
      }
      if(!spbill_create_ip){
        ctx.body = { ok: false, msg: '缺乏spbill_create_ip参数' }
        await next()
        return
      }
      // 创建充值订单
      let thisPay = await Pay.create({
        chargeid: chargeid,
        userid: payload.userid,
        pay_money: pay_money,
        yuebi_num: yuebi_num,
        status: 0,
        des: `用户 ${thisUser.username} 于 ${monent().format('YYYY/MM/DD HH/MM/SS')} 提交充值申请，充值${pay_money}元， 完成充值后获得${yuebi_num}书币`,
        create_time: new Date()
      })
      let payParams = createUnifiedOrder({
        openid: thisUser.openid,
        body: `订单编号: ${thisPay._id}`,
        out_trade_no: thisPay._id,
        pay_money: pay_money,
        spbill_create_ip: spbill_create_ip,
        chargeid: chargeid
      })
    }else{
        ctx.throw('token过期', 401)
        await next()
    }
  })
}
