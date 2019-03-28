import request from 'superagent'
import requestProxy from 'superagent-proxy'
import userAgent from 'fake-useragent'
import Redis from 'ioredis'
import config from '../config'
import getProxyIpAddress from './proxy'

// superagent添加使用代理ip的插件
requestProxy(request)
// 连接redis
const redis = new Redis({
  port: config.redis_port, // Redis port
  host: config.redis_host, // Redis host
  family: 4, // 4 (IPv4) or 6 (IPv6)
  password: config.redis_auth ? config.redis_pass : null
})

async function doGetRequest(url) {
  console.log(userAgent())
  request
    .get('http://www.77xsw.la/')
    .set({ 'User-Agent': userAgent() })
    .timeout({ response: 5000, deadline: 60000 })
    .proxy('http://116.209.58.74:9999')
    .end(async (err, res) => {
      console.log('TCL: doGetRequest -> err, res', err, res)
      // 处理数据
    })
}

async function searchQianQianFaction(keyword = '') {
  return new Promise(async (resolve, reject) => {
    await doGetRequest()
  })
}

async function searchThirdPartFaction(keyword = '') {
  // 搜索千千小说网
  // let result1 = await doGetRequest()
  // console.log('TCL: searchThirdPartFaction -> result1', result1)
  getProxyIpAddress()
}

export { searchThirdPartFaction }
