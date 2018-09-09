import { Pay, Good, User, Charge } from '../models'
import { createUnifiedOrder, weixinpay } from '../utils/weixin'
import { checkUserToken, tool } from '../utils'
import moment from 'moment'

export default function(router) {
  router.post('/api/pay', async (ctx, next) => {
    let userid = await checkUserToken(ctx, next)
    if (userid) {
      let { chargeids, pay_money, yuebi_num, spbill_create_ip } = ctx.request.body
      console.log('支付请求参数: ' + JSON.stringify(ctx.request.body))
      // 查询得到用户的openid
      let thisUser = await User.findById(userid)
      // 参数验证
      if (!(chargeids instanceof Array) || chargeids.length < 1) {
        ctx.body = { ok: false, msg: 'chargeids参数错误' }
        await next()
        return
      }
      if (!pay_money) {
        ctx.body = { ok: false, msg: '缺乏pay_money参数' }
        await next()
        return
      } else {
        pay_money = parseFloat(pay_money)
      }
      if (!yuebi_num) {
        ctx.body = { ok: false, msg: '缺乏yuebi_num参数' }
        await next()
        return
      } else {
        yuebi_num = parseInt(yuebi_num)
      }
      if (!spbill_create_ip) {
        ctx.body = { ok: false, msg: '缺乏spbill_create_ip参数' }
        await next()
        return
      }
      // 创建充值订单
      let thisPay = await Pay.create({
        chargeids: chargeids,
        userid: userid,
        pay_money: pay_money,
        yuebi_num: yuebi_num,
        status: 0,
        des: `用户 ${thisUser.username} 于 ${moment().format('YYYY/MM/DD HH/MM/SS')} 提交充值申请，充值${pay_money}元， 完成充值后获得${yuebi_num}书币`,
        create_time: new Date()
      })
      console.log({
        openid: thisUser.openid,
        body: `order_num:${thisPay._id}`,
        out_trade_no: thisPay.id.toString(),
        pay_money: pay_money,
        spbill_create_ip: spbill_create_ip,
        chargeids: chargeids
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
      if (payParams && payParams.appid) {
        ctx.body = { ok: true, msg: '生成微信订单成功', params: payParams, pay_id: thisPay.id.toString() }
      } else {
        ctx.body = { ok: false, msg: '生成微信订单失败', params: payParams }
      }
    }
  })

  router.post('/api/pay/notify', async (ctx, next) => {
    console.log('微信回调...')
    // 处理商户业务逻辑
    let promise = new Promise(function(resolve, reject) {
      let buf = ''
      ctx.req.setEncoding('utf8')
      ctx.req.on('data', chunk => {
        buf += chunk
      })
      ctx.req.on('end', () => {
        tool
          .xmlToJson(buf)
          .then(resolve)
          .catch(reject)
      })
    })

    await promise
      .then(async result => {
        // console.log(result)
        ctx.type = 'xml'
        // 判断result是否为空，为空则返回fail
        if (tool.isEmpty(result)) {
          ctx.body = `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[支付失败]]></return_msg></xml>`
        } else {
          if (result.xml && result.xml.out_trade_no && result.xml.out_trade_no[0]) {
            let thisPay = await Pay.findById(result.xml.out_trade_no[0])
            if (thisPay._id) {
              if (result.xml && result.xml.result_code && result.xml.result_code[0] === 'SUCCESS') {
                // 为了防止多次回调重复修改用户书币数，这里限制订单status为1时不做增加书币处理
                if (thisPay.status !== 1) {
                  // 增加用户书币
                  let addAmontResult = await User.addAmount(thisPay.userid, thisPay.yuebi_num, '充值书币')
                  if (addAmontResult) {
                    // 处理订单状态, 修改status的值
                    await Pay.updateStatus(result.xml.out_trade_no[0], 1)
                    console.log('ID为' + thisPay._id + '的订单支付成功，为ID为' + thisPay.userid + '下发' + thisPay.yuebi_num + '书币')
                  } else {
                    await Pay.updateStatus(result.xml.out_trade_no[0], 4)
                    await Pay.updateDes(result.xml.out_trade_no[0], '支付成功，但下发书币失败', 1)
                    console.log('ID为' + thisPay.userid + '的用户支付成功，但是下发书币失败')
                  }
                }
                ctx.body = `<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>`
              } else {
                await Pay.updateStatus(result.xml.out_trade_no[0], 2)
                ctx.body = `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[支付失败]]></return_msg></xml>`
                console.log('支付失败')
              }
            } else {
              ctx.body = `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[订单不存在]]></return_msg></xml>`
              console.log('订单支付失败，找不到ID为' + result.xml.out_trade_no[0] + '的订单，微信回调参数: ' + JSON.stringify(result))
            }
          } else {
            ctx.body = `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[订单不存在]]></return_msg></xml>`
            console.log('订单支付失败，微信回调参数: ' + JSON.stringify(result))
          }
        }
        await next()
      })
      .catch(e => {
        e.status = 400
      })
  })

  // 小程序报告取消支付
  router.get('/api/pay/cancel', async (ctx, next) => {
    let payId = ctx.request.query.pay_id
    if (payId) {
      let updateResult = await Pay.updateStatus(payId, 3)
      // 关闭订单
      weixinpay.closeOrder({ out_trade_no: payId }, function(err, result) {})
      if (updateResult) {
        console.log('ID为' + payId + '的订单被取消')
        ctx.body = { ok: true, msg: '取消订单成功' }
      } else {
        console.log('ID为' + payId + '的订单取消失败，参数错误')
        ctx.body = { ok: false, msg: '取消订单失败，参数错误' }
      }
    } else {
      console.log('ID为' + payId + '的订单取消失败，参数错误')
      ctx.body = { ok: false, msg: '取消订单失败，参数错误' }
    }
  })
}
