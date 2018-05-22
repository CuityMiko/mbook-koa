// 下载小程序二维码的工具js
const Redis = require('ioredis')
const request = require('request')
const fs = require('fs')
const path = require('path')
const qn = require('qn')
const config = require('../config')

const redis = new Redis({
  port: 6379, // Redis port
  host: '193.112.196.41', // Redis host
  family: 4, // 4 (IPv4) or 6 (IPv6)
  password: 'redis'
})

// qiniu上传设置
const client = qn.create({
  accessKey: config.accessKey,
  secretKey: config.secretKey,
  bucket: 'upload',
  origin: 'https://fs.andylistudio.com'
})

async function getWxToken() {
  // 查看redis中是否存在token值
  const wxTokenInRedis = await redis.get('wxToken')
  if (wxTokenInRedis) {
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
      console.error('获取token失败')
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
          appid: config.wx_appid,
          secret: config.wx_secret
        }
      },
      (error, response, body) => {
        if (error) {
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
        url: 'https://api.weixin.qq.com/wxa/getwxacode?access_token=' + token,
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify({
          // 传入shareId作为sence值
          path: 'pages/activities/share/share?code=' + shareId,
          width: 430,
          auto_color: false,
          line_color: { r: '0', g: '0', b: '0' },
          is_hyaline: true
        }),
        encoding: null
      },
      (error, response, body) => {
        if (error) {
          reject(error)
          return
        }
        const image = new Buffer(body, 'binary')
        // 上传到七牛云
        client.upload(image, { key: 'mbook/share/' + shareId + '.jpeg' }, function(uploadError, result) {
          if (uploadError) {
            reject(uploadError)
            return
          }
          resolve(result.url)
        })
      }
    )
  })
}

module.exports = {
  requestWxCode
}
