/*
 * @Description: 获取代理ip地址，并将它们存入redis中
 * @Author: lidikang
 * @LastEditors: lidikang
 * @Date: 2019-03-19 23:33:51
 * @LastEditTime: 2019-03-25 23:28:19
 */
import request from 'superagent'
import requestProxy from 'superagent-proxy'
import userAgent from 'fake-useragent'
import cheerio from 'cheerio'
import PQueue from 'p-queue'
import redis from '../utils/redis'

// superagent添加使用代理ip的插件
requestProxy(request)

function getProxyIpAddress() {
  redis.set('mbook_spider_proxy_ips', new Set(), 'EX', 10 * 60)
  request
    .get(`https://www.kuaidaili.com/free/inha/1/`)
    .set({ 'User-Agent': userAgent() })
    .timeout({ response: 5000, deadline: 60000 })
    .end(async (err, res) => {
      const $ = cheerio.load(res.text)
      // 处理数据
      let ips = []
      $('table td[data-title="IP"]').each((index, element) => {
        ips.push(
          `${$(element).text()}:${$('table td[data-title="PORT"]')
            .eq(index)
            .text()}`
        )
      })
      console.log(ips)
      // 校验代理的可用性
      const queue = new PQueue({ concurrency: 1 })
      ips.forEach(item => {
        queue.add(() => {
          testProxy(item)
            .then(ip => {
              console.log('Add useful ip: ' + ip)
              redis.sadd('mbook_spider_proxy_ips', ip)
            })
            .catch(ip => {
              console.log('Remove useless ip: ' + ip)
            })
        })
      })
      queue.onIdle().then(() => {
        console.log('12. All work is done');
      });
    })
}

function testProxy(ip) {
  return new Promise((resolve, reject) => {
    request
      .get(`http://www.77xsw.la/`)
      .set({ 'User-Agent': userAgent() })
      .timeout({ response: 10000, deadline: 60000 })
      .proxy(`http://${ip}`)
      .end(async (err, res) => {
        if (err) {
          reject(ip)
          return
        }
        resolve(ip)
      })
  })
}

export default getProxyIpAddress
