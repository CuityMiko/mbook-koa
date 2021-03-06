import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { WX_MINIPROGRAM_APP_ID, WX_PAY_MCH_ID, WX_PAY_NOTIFY_URL, WX_PAY_PARTNER_KEY, WX_PAY_PFX } from '../../config'
import { md5 } from '../index'

// 初始化微信支付
const WeiXinPay = require('../weixin-pay/index')
const weixinpay = new WeiXinPay({
  appid: WX_MINIPROGRAM_APP_ID,
  mch_id: WX_PAY_MCH_ID,
  partner_key: WX_PAY_PARTNER_KEY,
  pfx: fs.readFileSync(path.join(__dirname + '/' + WX_PAY_PFX))
})
/**
 * 解析微信登录用户数据
 * @param sessionKey
 * @param encryptedData
 * @param iv
 * @returns {Promise.<string>}
 */
async function decryptUserInfoData(sessionKey, encryptedData, iv) {
  // base64 decode
  const _sessionKey = new Buffer(sessionKey, 'base64')
  encryptedData = new Buffer(encryptedData, 'base64')
  iv = new Buffer(iv, 'base64')
  let decoded = ''
  try {
    // 解密
    const decipher = crypto.createDecipheriv('aes-128-cbc', _sessionKey, iv)
    // 设置自动 padding 为 true，删除填充补位
    decipher.setAutoPadding(true)
    decoded = decipher.update(encryptedData, 'binary', 'utf8')
    decoded += decipher.final('utf8')

    decoded = JSON.parse(decoded)
  } catch (err) {
    return ''
  }

  if (decoded.watermark.appid !== think.config('weixin.appid')) {
    return ''
  }

  return decoded
}

/**
 * 统一下单
 * @param payInfo
 * @returns {Promise}
 */
function createUnifiedOrder(payInfo) {
  return new Promise((resolve, reject) => {
    weixinpay.createUnifiedOrder(
      {
        body: payInfo.body,
        out_trade_no: payInfo.out_trade_no,
        total_fee: payInfo.pay_money,
        spbill_create_ip: payInfo.spbill_create_ip,
        notify_url: WX_PAY_NOTIFY_URL,
        trade_type: 'JSAPI',
        openid: payInfo.openid,
        product_id: payInfo.chargeids.join('|')
      },
      (error, result) => {
        // console.log(error, result)
        if (result && result.return_code === 'SUCCESS' && result.return_msg === 'OK') {
          const returnParams = {
            appid: result.appid,
            timeStamp: parseInt(Date.now() / 1000) + '',
            nonceStr: result.nonce_str,
            package: 'prepay_id=' + result.prepay_id,
            signType: 'MD5'
          }
          const paramStr = `appId=${returnParams.appid}&nonceStr=${returnParams.nonceStr}&package=${returnParams.package}&signType=${returnParams.signType}&timeStamp=${returnParams.timeStamp}&key=${WX_PAY_PARTNER_KEY}`
          returnParams.paySign = md5(paramStr).toUpperCase()
          resolve(returnParams)
        } else {
          console.log('生成微信支付订单失败：', JSON.stringify(result))
          reject(error)
        }
      }
    )
  })
}

/**
 * 生成排序后的支付参数 query
 * @param queryObj
 * @returns {Promise.<string>}
 */
function buildQuery(queryObj) {
  const sortPayOptions = {}
  for (const key of Object.keys(queryObj).sort()) {
    sortPayOptions[key] = queryObj[key]
  }
  let payOptionQuery = ''
  for (const key of Object.keys(sortPayOptions).sort()) {
    payOptionQuery += key + '=' + sortPayOptions[key] + '&'
  }
  payOptionQuery = payOptionQuery.substring(0, payOptionQuery.length - 1)
  return payOptionQuery
}

/**
 * 对 query 进行签名
 * @param queryStr
 * @returns {Promise.<string>}
 */
function signQuery(queryStr) {
  queryStr = queryStr + '&key=' + think.config('weixin.partner_key')
  const md5Sign = md5(queryStr)
  return md5Sign.toUpperCase()
}

/**
 * 处理微信支付回调
 * @param notifyData
 * @returns {{}}
 */
function payNotify(notifyData) {
  if (think.isEmpty(notifyData)) {
    return false
  }

  const notifyObj = {}
  let sign = ''
  for (const key of Object.keys(notifyData)) {
    if (key !== 'sign') {
      notifyObj[key] = notifyData[key][0]
    } else {
      sign = notifyData[key][0]
    }
  }
  if (notifyObj.return_code !== 'SUCCESS' || notifyObj.result_code !== 'SUCCESS') {
    console.log('return_code false')
    return false
  }
  const signString = this.signQuery(this.buildQuery(notifyObj))
  if (think.isEmpty(sign) || signString !== sign) {
    return false
  }
  return notifyObj
}

export { decryptUserInfoData, createUnifiedOrder, buildQuery, signQuery, payNotify, weixinpay }
