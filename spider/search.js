import request from 'superagent'
import requestProxy from 'superagent-proxy'
import userAgent from 'fake-useragent'
import getProxyIpAddress from './proxy'
import redis from '../utils/redis'

// superagent添加使用代理ip的插件
requestProxy(request)
<<<<<<< Updated upstream
// 连接redis
const redis = new Redis({
  port: config.redis_port, // Redis port
  host: config.redis_host, // Redis host
  family: 4, // 4 (IPv4) or 6 (IPv6)
  password: config.redis_auth ? config.redis_pass : null
})
=======

>>>>>>> Stashed changes

async function doGetRequest(url) {
  console.log(userAgent())
  request
    .get('http://www.77xsw.la/')
    .set({ 'User-Agent': userAgent() })
    .timeout({ response: 10000, deadline: 60000 })
    .proxy('http://163.204.244.224:9999')
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
