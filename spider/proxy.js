/*
 * @Description: 获取代理ip地址，并将它们存入redis中
 * @Author: lidikang
 * @LastEditors: lidikang
 * @Date: 2019-03-19 23:33:51
 * @LastEditTime: 2019-04-07 10:40:01
 */
import request from 'superagent'
import requestProxy from 'superagent-proxy'
import userAgent from 'fake-useragent'
import redis from '../utils/redis'

// superagent添加使用代理ip的插件
requestProxy(request)

/**
 * 设置本地ip为白名单，防止芝麻代理关闭获取代理的接口
 */
function setLocalIpAddressWhiteList(ip) {
  request
    .get('http://web.http.cnapi.cc/index/index/save_white?neek=63503&appkey=a56636a4610d15bb0e7cbbd8d8e543b7&white=' + ip)
    .set({ 'User-Agent': userAgent() })
    .timeout({ response: 5000, deadline: 60000 })
    .end(async (err, res) => {
      if (err) {
        console.log('add failed!', err.toString())
        return
      }

      try {
        const data = JSON.parse(res.text)
        if (data.code === 0) {
          console.log('add success!')
          console.log('get proxy again...')
          // 重新获取ip
          getProxyIpAddress()
        }
      } catch (error) {
        console.log('add failed!', error.toString())
      }
    })
}

/**
 * 从redis随机读取一个ip作为代理
 */
async function getRandomProxyIp() {
  let ipStr = await redis.get('mbook_spider_proxy_ips')
  let ipArr = ipStr.split(',')
  return ipArr[parseInt(Math.random(0, 1) * ipArr.length, 10)] || ''
}

/**
 * 向芝麻代理请求可用ip地址，并村存储到redis中
 */
function getProxyIpAddress() {
  redis.del('mbook_spider_proxy_ips')
  request
    .get('http://webapi.http.zhimacangku.com/getip?num=10&type=2&pro=&city=0&yys=0&port=1&time=1&ts=0&ys=0&cs=0&lb=1&sb=0&pb=4&mr=1&regions=')
    .set({ 'User-Agent': userAgent() })
    .timeout({ response: 5000, deadline: 60000 })
    .end(async (err, res) => {
      if (err) {
        console.log('proxy ip getting failed!')
        return
      }
      try {
        const data = JSON.parse(res.text)
        if (data.code === 113) {
          const reg = /(\d+\.?)+/
          const ipTemp = data.msg.match(reg)
          if (ipTemp) {
            const ip = ipTemp[0]
            console.log(`add ${ip} to white list..`)
            setLocalIpAddressWhiteList(ip)
          }
          return
        } else if (data.code === 0) {
          const ips = data.data.map(item => `${item.ip}:${item.port}`)
          redis.set('mbook_spider_proxy_ips', ips.join(','))
          console.log('add proxy ip: ' + ips.join(', '))
        } else {
          console.log('proxy ip getting failed!', data.msg)
        }
      } catch (error) {
        console.log('proxy ip getting failed!', error.toString())
      }
    })
}

export default { getRandomProxyIp, getProxyIpAddress }
