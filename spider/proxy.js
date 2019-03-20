/*
 * @Description: 获取代理ip地址，并将它们存入redis中
 * @Author: lidikang
 * @LastEditors: lidikang
 * @Date: 2019-03-19 23:33:51
 * @LastEditTime: 2019-03-21 00:00:30
 */
import request from 'superagent'
import requestProxy from 'superagent-proxy'
import userAgent from 'fake-useragent'
import cheerio from 'cheerio'

// superagent添加使用代理ip的插件
requestProxy(request)

function getProxyIpAddress() {
  request
    .get(`http://www.data5u.com/free/gngn/index.shtml`)
    .set({ 'User-Agent': userAgent() })
    .timeout({ response: 5000, deadline: 60000 })
    .end(async (err, res) => {
      const $ = cheerio.load(res.text)
      // 处理数据
      let ips = []
      $('.wlist .l2 span:first-child li').each((index, element) => {
        ips.push(
          `${$(element).text()}:${$('.wlist .l2 span:nth-child(2) li')
            .eq(index)
            .text()}`
        )
      })
      console.log(ips)
      // 校验代理的可用性
      ips.forEach(item => {
        testProxy()
      })
    })
}

function testProxy() {
  return new Promise((resolve, reject) => {
    request
      .get(`http://www.77xsw.la/`)
      .set({ 'User-Agent': userAgent() })
      .timeout({ response: 5000, deadline: 60000 })
      .proxy(`http://${}`)
      .end(async (err, res) => {
        if (err) {
          reject(err)
          return
        }
        resolve(res)
      })
  })
}

export default getProxyIpAddress
