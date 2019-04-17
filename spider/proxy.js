/*
 * @Description: 获取代理ip地址，并将它们存入redis中
 * @Author: lidikang
 * @LastEditors: lidikang
 * @Date: 2019-03-19 23:33:51
 * @LastEditTime: 2019-04-16 23:41:13
 */
import request from 'superagent'
import requestProxy from 'superagent-proxy'
import userAgent from 'fake-useragent'
import redis from '../utils/redis'
import { logger } from './log'

// superagent添加使用代理ip的插件
requestProxy(request)

/**
 * 设置本地ip为白名单，防止芝麻代理关闭获取代理的接口
 */
function setLocalIpAddressWhiteList(ip) {
  request
    .get('http://web.http.cnapi.cc/index/index/save_white?neek=67203&appkey=1c1c6c34947a721a0ba3c015aaa5a2fb&white=' + ip)
    .set({ 'User-Agent': userAgent() })
    .timeout({ response: 5000, deadline: 60000 })
    .end(async (err, res) => {
      if (err) {
        logger.error('add failed!', err.toString())
        return
      }

      try {
        const data = JSON.parse(res.text)
        if (data.code === 0) {
          logger.debug('add to white list success!')
          logger.debug('get proxy again...')
          // 重新获取ip
          getProxyIpAddress()
        }
      } catch (error) {
        logger.error('add failed! ' + error.toString())
      }
    })
}

/**
 * 从redis随机读取一个ip作为代理
 */
async function getRandomProxyIp() {
  let ipStr = await redis.get('mbook_spider_proxy_ips') || ''
  let ipArr = ipStr.split(',')
  return ipArr[parseInt(Math.random(0, 1) * ipArr.length, 10)] || ''
}

/**
 * 从redis中移除不能使用的ip地址
 */
async function removeProxyIpFromRedis(address) {
  let ipStr = await redis.get('mbook_spider_proxy_ips') || ''
  let ipArr = ipStr.split(',')
  ipArr = ipArr.filter(item => item !== address)
  redis.set('mbook_spider_proxy_ips', ipArr.join(','))
  logger.debug('remove address ' + address + ' from redis')
}

/**
 * 向芝麻代理请求可用ip地址，并村存储到redis中
 */
function getProxyIpAddress() {
  return new Promise((resolve, reject) => {
    redis.del('mbook_spider_proxy_ips')
    request
      .get('http://webapi.http.zhimacangku.com/getip?num=50&type=2&pro=&city=0&yys=0&port=1&time=1&ts=0&ys=0&cs=0&lb=1&sb=0&pb=4&mr=1&regions=')
      .set({ 'User-Agent': userAgent() })
      .timeout({ response: 5000, deadline: 60000 })
      .end(async (err, res) => {
        if (err) {
          logger.error('proxy ip getting failed! ' + err.toString())
          return
        }
        try {
          const data = JSON.parse(res.text)
          if (data.code === 113) {
            const reg = /(\d+\.?)+/
            const ipTemp = data.msg.match(reg)
            if (ipTemp) {
              const ip = ipTemp[0]
              logger.debug(`add ${ip} to white list..`)
              setLocalIpAddressWhiteList(ip)
            }
            return
          } else if (data.code === 0) {
            const ips = data.data.map(item => `${item.ip}:${item.port}`)
            redis.set('mbook_spider_proxy_ips', ips.join(','))
            logger.debug('add proxy ip: ' + ips.join(', '))
          } else {
            logger.debug('proxy ip getting failed!', data.msg)
          }
          resolve(true)
        } catch (error) {
          logger.debug('proxy ip getting failed! ' + error.toString())
          reject(err)
        }
      })
  })
}

export default { getRandomProxyIp, getProxyIpAddress, removeProxyIpFromRedis }