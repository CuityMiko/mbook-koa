// 下载小程序二维码的工具js
const request = require('request')
const config = require('../../config')
const sign = require('./wxSign')
const redis = require('../redis')
const qiniuUpload = require('../qiniuUpload')

async function getWxToken(noredis) {
  // 查看redis中是否存在token值
  const wxTokenInRedis = await redis.get('wxToken')
  if (wxTokenInRedis && !noredis) {
    return wxTokenInRedis
  } else {
    let newToken = await requestWxToken()
    if (typeof newToken === 'string') {
      newToken = JSON.parse(newToken)
    }
    if (newToken.access_token) {
      // 存储新的token
      redis.set('wxToken', newToken.access_token, 'EX', 2 * 60 * 60)
      return newToken.access_token
    } else {
      console('getWxToken 获取token失败')
      return ''
    }
  }
}

async function requestWxToken() {
  // 请求方式以及参数说明见https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421140183
  return new Promise((resolve, reject) => {
    request(
      {
        method: 'GET',
        url: 'https://api.weixin.qq.com/cgi-bin/token',
        qs: {
          grant_type: 'client_credential',
          appid: config.wxMiniprogramAppId,
          secret: config.wxMiniprogramSecret
        }
      },
      (error, response, body) => {
        if (error) {
          console.log('接口地址: https://api.weixin.qq.com/cgi-bin/token')
          console.log(
            '接口请求参数',
            JSON.stringify({
              grant_type: 'client_credential',
              appid: config.wxMiniprogramAppId,
              secret: config.wxMiniprogramSecret
            })
          )
          console.log('微信接口请求失败', error)
          reject(error)
          return
        }
        resolve(body)
      }
    )
  })
}

async function requestWxCode(shareId) {
  const token = await getWxToken()
  return new Promise((resolve, reject) => {
    // 请求方式以及参数说明见https://developers.weixin.qq.com/miniprogram/dev/api/qrcode.html
    request(
      {
        method: 'POST',
        url: 'https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=' + token,
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify({
          // 传入shareId作为sence值
          scene: shareId,
          path: 'pages/loading/loading',
          width: 430,
          auto_color: false,
          line_color: { r: '0', g: '0', b: '0' },
          is_hyaline: false
        }),
        encoding: null
      },
      (error, response, body) => {
        if (error) {
          console.log('接口地址', 'https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=' + token)
          console.log('接口请求参数', {
            scene: shareId,
            path: 'pages/loading/loading',
            width: 430,
            auto_color: false,
            line_color: { r: '0', g: '0', b: '0' },
            is_hyaline: false
          })
          console.log('微信接口请求失败', error)
          reject(error)
          return
        }
        const image = Buffer.from(body, 'binary')
        // 上传到七牛云
        qiniuUpload.upload(image, 'mbook/share/' + shareId + '.jpeg')
          .then(result => {
            resolve(result.url)
          })
          .catch(error => {
            console.log('图片上传七牛云失败', error)
            reject(error)
          })
      }
    )
  })
}

// 获取ticket
async function getTicket() {
  // 查看redis中是否存在token值
  const wxTicketInRedis = await redis.get('wxTicket')
  if (wxTicketInRedis) {
    return wxTicketInRedis
  } else {
    let newTicket = await requestWxTicket()
    console.log(newTicket)
    if (typeof newTicket === 'string') {
      newTicket = JSON.parse(newTicket)
    }
    if (newTicket.ticket) {
      // 存储新的token
      redis.set('wxToken', newTicket.ticket, 'EX', 2 * 60 * 60)
      return newTicket.ticket
    } else {
      console.log('获取ticket失败')
      return ''
    }
  }
}

// 获取网页跳转的微信ticket
async function requestWxTicket(url) {
  const token = await getWxToken(true)
  return new Promise((resolve, reject) => {
    // 请求方式以及参数说明见https://developers.weixin.qq.com/miniprogram/dev/api/qrcode.html
    request(
      {
        method: 'POST',
        url: 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=' + token + '&type=jsapi',
        headers: {
          'Content-type': 'application/json'
        }
      },
      (error, response, body) => {
        if (error) {
          console.log('接口地址', 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=' + token + '&type=jsapi')
          console.log('微信接口请求失败', error)
          reject(error)
          return
        }
        resolve(body)
      }
    )
  })
}

// 签名
async function signTicket() {
  const ticket = await getTicket()
  const url = 'https://game.weixin.qq.com/cgi-bin/h5/static/community/club_detail.html?jsapi=1&banner_need=1&uin=&key=&appid=wx35a4657522d31151&topic_id=37467564&ssid=7&is_self=1&cluster_id=&is_article=&_a=1#wechat_redirect'
  return sign(ticket, url)
}

// 发送微信模板消息
async function sendWxMessage(openid, templateId, page, formId, data) {
  const token = await getWxToken()
  console.log('请求token', token)
  console.log('用户opendid', openid)
  console.log('模板id', templateId)
  console.log('消息跳转页面', page)
  console.log('微信formId', formId)
  console.log('消息', data)
  return new Promise((resolve, reject) => {
    // 请求方式以及参数说明见https://developers.weixin.qq.com/miniprogram/dev/api/qrcode.html
    request(
      {
        method: 'POST',
        url: 'https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send?access_token=' + token + '&type=jsapi',
        json: true,
        body: {
          touser: openid,
          template_id: templateId,
          page,
          form_id: formId,
          data
        },
        headers: {
          'Content-type': 'application/json'
        }
      },
      (error, response, body) => {
        if (error) {
          console.log('接口地址', 'https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send?access_token=' + token + '&type=jsapi')
          console.log('微信接口请求失败', error)
          reject(error)
          return
        }
        resolve(body)
      }
    )
  })
}

module.exports = {
  requestWxCode,
  signTicket,
  sendWxMessage
}
