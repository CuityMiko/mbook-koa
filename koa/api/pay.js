import { Pay, Good, User, Charge } from '../models'
import { createUnifiedOrder } from '../utils/weixin'
import { jwtVerify } from '../utils'
import moment from 'moment'

export default function (router) {
  router.post('/api/pay', async (ctx, next) => {
    let { chargeids, pay_money, yuebi_num, spbill_create_ip } = ctx.request.body
    console.log(chargeids, pay_money, yuebi_num, spbill_create_ip)
    let payload = await jwtVerify(ctx.header.authorization.split(' ')[1])
    if(payload && payload.userid){
      // 查询得到用户的openid
      let thisUser = await User.findById(payload.userid)
      // 参数验证
      if(!(chargeids instanceof Array) || chargeids.length < 1){
        ctx.body = { ok: false, msg: 'chargeids参数错误' }
        await next()
        return
      }
      if(!pay_money){
        ctx.body = { ok: false, msg: '缺乏pay_money参数' }
        await next()
        return
      }else{
        pay_money = parseFloat(pay_money)
      }
      if(!yuebi_num){
        ctx.body = { ok: false, msg: '缺乏yuebi_num参数' }
        await next()
        return
      }else{
        yuebi_num = parseInt(yuebi_num)
      }
      if(!spbill_create_ip){
        ctx.body = { ok: false, msg: '缺乏spbill_create_ip参数' }
        await next()
        return
      }
      // 创建充值订单
      let thisPay = await Pay.create({
        chargeids: chargeids,
        userid: payload.userid,
        pay_money: pay_money,
        yuebi_num: yuebi_num,
        status: 0,
        des: `用户 ${thisUser.username} 于 ${moment().format('YYYY/MM/DD HH/MM/SS')} 提交充值申请，充值${pay_money}元， 完成充值后获得${yuebi_num}书币`,
        create_time: new Date()
      })
      let payParams = await createUnifiedOrder({
        openid: thisUser.openid,
        body: `订单编号:${thisPay._id}`,
        out_trade_no: thisPay.id.toString(),
        pay_money: pay_money,
        spbill_create_ip: spbill_create_ip,
        chargeids: chargeids
      })
      // 判断生成微信订单是否成功
      console.log('创建支付订单成功 ✔')
      if(payParams && payParams.appid){
        ctx.body = { ok: true, msg: '生成微信订单成功', params: payParams }
      }else{
        ctx.body = { ok: false, msg: '生成微信订单失败', params: payParams }
      }
    }else{
        ctx.throw('token过期', 401)
        await next()
    }
  })
}
