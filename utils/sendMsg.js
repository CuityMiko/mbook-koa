/**
 * 发送短信
 * @export
 * @param {String} template 模板名称
 * @param {String} mobile 手机号码
 * @param {Object} data 模板数据 { "#app#": "贷款小助手", "#code#": 123456 }
 * @returns {Object} { success: true, msg: '发送成功' }
 */
import { PIAN_YUN_SECRET } from '../config'
import qs from 'querystring'
import request from 'request'

const templateMap = {
  loginOrRegiste: '2874922'
}

export function sendMessage(template, mobile, data) {
  return new Promise((resolve, reject) => {
    const callback = (error, response, body) => {
      if (!error && response.statusCode == 200) {
        resolve({ success: true, message: '发送成功' })
      } else {
        if (body) body = JSON.parse(body)
        resolve({
          success: false,
          message: `发送失败${body && body.detail ? '，' + body.detail : '，请求错误'}`
        })
      }
    }

    request(
      {
        method: 'POST',
        url: 'http://sms.yunpian.com/v2/sms/tpl_single_send.json',
        body: qs.stringify({
          apikey: PIAN_YUN_SECRET,
          mobile,
          tpl_id: templateMap[template],
          tpl_value: qs.stringify(data)
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        }
      },
      callback
    )
  })
}
