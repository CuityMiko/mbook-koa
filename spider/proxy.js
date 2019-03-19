/*
 * @Description: 获取代理ip地址，并将它们存入redis中
 * @Author: lidikang
 * @LastEditors: lidikang
 * @Date: 2019-03-19 23:33:51
 * @LastEditTime: 2019-03-19 23:52:05
 */
import request from 'superagent'
import userAgent from 'fake-useragent'
import cheerio from 'cheerio'

let curPage = 1

function getProxyIpAddress() {
  console.log(1111)
  request
    .get(`http://www.89ip.cn/index_${curPage}.html`)
    .set({ 'User-Agent': userAgent() })
    .timeout({ response: 5000, deadline: 60000 })
    .end(async (err, res) => {
      const $ = cheerio.load(res.text)
      // 处理数据
      let ips = []
      $('tbody tr td:first-child').each((index, element) => {
        console.log(element.text())
      })
    })
}


export default getProxyIpAddress
