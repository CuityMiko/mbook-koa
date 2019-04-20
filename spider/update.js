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
import Queue from 'p-queue'
import { getRandomProxyIp, getProxyIpAddress, removeProxyIpFromRedis } from './proxy'
import chinese2number from '../utils/chineseToNum'
import { readUpdateNotice } from '../bin/readUpdateNotice'
import { reportError } from '../utils'
import { logger } from './log'

// superagent添加使用代理ip的插件
requestProxy(request)
requestCharset(request)

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
      .timeout({ response: 10000, deadline: 10000 })
      .proxy(`http://${proxyIp}`)
    return response.text || ''
  } catch (err) {
    logger.error('请求发生错误，尝试重新请求, ' + err.toString())
    // 剔除当前不能访问的ip地址
    // await removeProxyIpFromRedis(proxyIp)
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
        const link =
          'https://www.qianqianxs.com' +
          $(element)
            .children('a')
            .attr('href')
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

function updateEveryBook(index, book, total) {
  return new Promise((resolve, reject) => {
    try {
      logger.debug(`正在进行第${index}本书籍《${book.name}》的更新，总共有${total}本...`)
      if (book.source && book.source instanceof Array) {
        let sources = []
        const sub1Quene = new Queue({ concurrency: 1, autoStart: false })
        book.source.forEach((item, index) => {
          sub1Quene.add(async () => {
            const chapters = await getSourceData(item, book.newest_chapter)
            sources = sources.concat(chapters)
          })
        })
        sub1Quene.start()
        sub1Quene.onIdle().then(() => {
          // 多个来源爬取完毕，现在对数据做去重处理
          let chapterNums = []
          let chapters = []
          for (let j = 0; j < sources.length; j++) {
            if (chapterNums.indexOf(sources[j].num) < 0) {
              chapters.push(sources[j])
              chapterNums.push(sources[j].num)
            }
          }
          logger.debug(`共找到${chapters.length}个最新章节`)
          // 逐一爬取最新的章节，并存储到数据库中
          const sub2Queue = new Queue({ concurrency: 1, autoStart: false })
          chapters.forEach((chapter, index) => {
            sub2Queue.add(async () => {
              const html = await doGetRequest(chapter.link)
              const $ = cheerio.load(html)
              const content = formatContent($(chapter.selector).text())
              const oldChapter = await Chapter.findOne({ bookid: book._id, num: chapter.num })
              if (!oldChapter) {
                const newChapter = await Chapter.create({
                  bookid: await Chapter.transId(book._id),
                  num: chapter.num,
                  name: chapter.name,
                  content,
                  create_time: new Date()
                })
                logger.debug(`已经创建章节: id: ${newChapter.id}, name: ${newChapter.name}, num: ${newChapter.num}, content: ${newChapter.content.slice(0, 10)}...`)
              }
            })
          })
          sub2Queue.start()
          sub2Queue.onIdle().then(() => {
            logger.debug(`已经更新章节: ${chapters.map(item => `第${item.num}章 ${item.name}`)}`)
            // 更改书籍更新时间
            Book.updateTime(book._id)
            logger.debug('已更新书籍更新时间...')
            // 更新提醒
            // console.log(`开始发送书籍更新提示, 书籍id ${needUpdateBooks[i]._id} 章节id ${lastId}...`)
            // readUpdateNotice(id, lastId, true)
            resolve(true)
          })
        })
      }
    } catch (err) {
      reject(err)
    }
  })
}

export async function updateBook() {
  try {
    let getProxyIpSuccess = await getProxyIpAddress()
    let timer = setInterval(async () => {
      await getProxyIpAddress()
    }, 10 * 60 * 1000) 
    if (!getProxyIpSuccess) {
      logger.debug('获取代理ip地址失败')
      return
    }
    logger.debug('开始执行书城更新...\n当前时间: ' + moment().format('YYYY-MM-DD hh:mm:ss'))
    let needUpdateBooks = await Book.find({ source: { $ne: null } }, 'name update_status newest_chapter source')
    if (needUpdateBooks.length === 0) {
      logger.debug('当前没有书籍需要更新')
      return
    }
    const queue = new Queue({ concurrency: 1, autoStart: false })
    needUpdateBooks.forEach((item, index) => {
      queue.add(async () => {
        await updateEveryBook(index + 1, item, needUpdateBooks.length)
      })
    })
    // 队列添加完毕，开始批量执行
    queue.start()
    // 监听队列执行完毕
    queue.onIdle().then(() => {
      clearInterval(timer)
      console.log(`更新执行完毕`)
    })
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
