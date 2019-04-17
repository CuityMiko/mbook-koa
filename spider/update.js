/**
 * 定期更新章节
 */
import { Book, Chapter } from '../models'
import request from 'superagent'
import cheerio from 'cheerio'
import requestProxy from 'superagent-proxy'
import requestCharset from 'superagent-charset'
import userAgent from 'fake-useragent'
import moment from 'moment'
import { getRandomProxyIp, getProxyIpAddress, removeProxyIpFromRedis } from './proxy'
import chinese2number from '../utils/chineseToNum'
import { readUpdateNotice } from '../bin/readUpdateNotice'
import { reportError } from '../utils'
import { logger } from './log'

// superagent添加使用代理ip的插件
requestProxy(request)
requestCharset(request)

// 重新获取代理ip
getProxyIpAddress()

/**
 * 发送请求
 * @param {*} url 请求地址
 * @param {*} callback 回调函数
 */
async function doGetRequest(url) {
  logger.debug(`请求地址 ${url}`)
  const proxyIp = await getRandomProxyIp()
  logger.debug('proxyIp: ' + proxyIp)
  try {
    let response = await request
      .get(url)
      .charset('gbk')
      .buffer(true)
      .set({ 'User-Agent': userAgent() })
      .timeout({ response: 10000, deadline: 60000 })
      .proxy(`http://${proxyIp}`)
    return response.text || ''
  } catch (err) {
    logger.error('请求发生错误，尝试重新请求, ' + err.toString())
    // 剔除当前不能访问的ip地址
    await removeProxyIpFromRedis(proxyIp)
    return await doGetRequest(url)
  }
}

/**
 * 获取书源章节
 * @param {*} source 书籍来源
 * @param {*} newest 书籍章节
 * @returns
 */
async function getSourceData(source, newest) {
  let result = []
  if (source.indexOf('www.qianqianxs.com') > -1) {
    const html = await doGetRequest(source)
    const $ = cheerio.load(html)
    $('.panel-body .list-group li').each((index, element) => {
      const name = $(element).text()
      const chapterTitleReg = /第?[零一二两三叁四五六七八九十百千万壹贰叁肆伍陆柒捌玖拾佰0-9]+章[\.、：: -]*[^\n]+/
      if (chapterTitleReg.test(name)) {
        const num = chinese2number(name.match(/第?[零一二两三叁四五六七八九十百千万壹贰叁肆伍陆柒捌玖拾佰0-9]+章/)[0].replace(/[第章]+/g, ''))
        const link = 'https://www.qianqianxs.com' + $(element).children('a').attr('href')
        if (num > newest) {
          result.push({
            num,
            name: name.replace(/^.*章[、\.：\s:-]*/, ''),
            link,
            selector: '.content-body'
          })
        }
      }
    })
    // TODO:章节去重
  }
  return result
}

function formatContent(str) {
  let result = str
  let rules = [
    /\(\)/g, // 特殊的括号
    /^\n+/g, // 章节前换行
    /\n+$/g, // 章节后换行
    /((快来看)|(福利)|(添加)|(美女)|(关注)|(给力)|(好看)).*小说！/g, // 关注微信消息
    /一秒记住【千千小说网 www\.77xsw\.la】，更新快，无弹窗，免费读！/g,
    /-->>/g,
    /本章未完，点击下一页继续阅读/g
  ]
  rules.forEach(item => {
    result = result.replace(item, '')
  })
  return result.trim()
}

export async function updateBook() {
  try {
    logger.debug('开始执行书城更新...\n当前时间: ' + moment().format('YYYY-MM-DD hh:mm:ss'))
    let needUpdateBooks = await Book.find({ source: { $ne: null } }, 'name update_status newest_chapter source')
    if (needUpdateBooks.length === 0) {
      logger.debug('当前没有书籍需要更新')
      return
    }
    // 逐一遍历所有来源，并汇总所有来源的书籍
    for (let i = 0; i < needUpdateBooks.length; i++) {
      logger.debug(`正在进行第${i + 1}本书籍《${needUpdateBooks[i].name}》的更新，总共有${needUpdateBooks.length}本...`)
      if (needUpdateBooks[i].source && needUpdateBooks[i].source instanceof Array) {
        let sources = []
        for (let k = 0; k < needUpdateBooks[i].source.length; k++) {
          const chapters = await getSourceData(needUpdateBooks[i].source[k], needUpdateBooks[i].newest_chapter)
          sources = sources.concat(chapters)
        }

        if (sources.length <= 0) {
          logger.debug('暂无最新章节')
          continue
        }

        // 多来源去重
        let chapterNums = []
        let chapters = []
        for (let j = 0; j < sources.length; j++) {
          if (chapterNums.indexOf(sources[j].num) < 0) {
            chapters.push(sources[j])
            chapterNums.push(sources[j].num)
          }
        }
        logger.debug(`共找到${chapters.length}个最新章节`)

        // 逐一爬取章节
        for (let m = 0; m < chapters.length; m++) {
          const html = await doGetRequest(chapters[m].link)
          const $ = cheerio.load(html)
          chapters[m].content = formatContent($(chapters[m].selector).text())
          // 存储章节
          let oldChapter = await Chapter.findOne({ bookid: needUpdateBooks[i]._id, num: chapters[m].num })
          if (!oldChapter) {
            let newChapter = await Chapter.create({
              bookid: await Chapter.transId(needUpdateBooks[i]._id),
              num: chapters[m].num,
              name: chapters[m].name,
              content: chapters[m].content,
              create_time: new Date()
            })
            if (newChapter && newChapter._id) {
              chapters[m].id = newChapter._id
            }
          }
        }
        logger.debug(`已经更新章节: ${chapters.map(item => `第${item.num}章 ${item.name}`)}`)
        // 更改书籍更新时间
        Book.updateTime(needUpdateBooks[i]._id)
        logger.debug('已更新书籍更新时间...')
        // 阅读更新通知
        const lastId = chapters[chapters.length - 1].id
        if (lastId) {
          // console.log(`开始发送书籍更新提示, 书籍id ${needUpdateBooks[i]._id} 章节id ${lastId}...`)
          // readUpdateNotice(id, lastId, true)
        }
        continue
      }
    }
  } catch (err) {
    logger.error('执行书籍更新失败, ' + err.toString())
    reportError('执行书籍更新失败', err, {
      priority: '紧急',
      category: '错误',
      extra: {
        current_time: moment().format('YYYY-MM-DD hh:mm:ss')
      }
    })
  }
}