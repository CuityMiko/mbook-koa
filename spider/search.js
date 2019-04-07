import request from 'superagent'
import requestProxy from 'superagent-proxy'
import userAgent from 'fake-useragent'
import { getRandomProxyIp } from './proxy'

// superagent添加使用代理ip的插件
requestProxy(request)

async function doGetRequest(url) {
  const proxyIp = await getRandomProxyIp()
  console.log('proxyIp', proxyIp)
  request
    .get('http://www.77xsw.la/')
    .set({ 'User-Agent': userAgent() })
    .timeout({ response: 5000, deadline: 60000 })
    .proxy(`http://${proxyIp}`)
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
  console.log('1111')
  // 搜索千千小说网
  let result1 = await doGetRequest()
  console.log('TCL: searchThirdPartFaction -> result1', result1)
  // getProxyIpAddress()
}

export { searchThirdPartFaction }
