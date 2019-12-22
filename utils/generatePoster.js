/**
 * 海报服务
 * 生成活动海报，并做缓存
 * 创建人： andyliwr
 * 时间： 2019年12月20日
 */

import puppeteer from 'puppeteer'
import path from 'path'
import os from 'os'
import fs from 'fs'
import uuid from 'uuid'
import qiniuUpload from './qiniuUpload'
import redis from '../utils/redis'
import { PORT } from '../config'

/**
 * 生成图片
 * @param url 差异网页地址
 * @param options 截图参数
 */
export async function screenshot(url, options) {
  const newOptions = {
    ...options,
    width: 1000,
    height: 'auto'
  }
  const defaultPuppeteerOptions = {
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    devtools: false,
    headless: true,
    ignoreHTTPSErrors: true,
    slowMo: 0
  }

  const defaultViewport = {
    deviceScaleFactor: 1,
    hasTouch: false,
    height: 1024,
    isLandscape: false,
    isMobile: false,
    width: newOptions.width
  }
  const browser = await puppeteer.launch({ ...defaultPuppeteerOptions })
  try {
    const page = await browser.newPage()
    await page.goto(url, { timeout: 3000000 })
    const element = await page.$('.container')
    const id = uuid.v1()
    // 图片保存至本地
    const tmpUrl = path.join(os.tmpdir(), `${id}.png`)
    await element.screenshot({
      path: tmpUrl
    })
    // 将图片上传至七牛云
    const imgUrl = await qiniuUpload(Buffer.from(fs.readFileSync(tmpUrl)), `mbook/poster/${id}.png`)
    await browser.close()
    return imgUrl
  } catch (err) {
    console.log(err)
    await browser.close()
    return null
  }
}

/**
 * 生成书籍分享海报
 */
export async function makeBookPoster(bookid) {
  if (!bookid) {
    return ''
  }
  // 检查redis是否存在缓存
  const redisValue = await redis.get(`poster_book_${bookid}`)
  if (redisValue) {
    return redisValue
  } else {
    // 需要重新生成
    const url = await screenshot(`http://localhost:${PORT}/api/front/poster/book_preview?id=${bookid}`, { width: 604, height: 'auto' })
    // 海报缓存12小时
    redis.set(`poster_book_${bookid}`, url, 'EX', 60 * 60 * 12)
    return url
  }
}
