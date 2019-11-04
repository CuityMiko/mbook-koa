import sendfile from 'koa-sendfile'
// import Canvas from 'canvas'
import qn from 'qn'
import https from 'https'
import uuid from 'uuid'
import convert from 'koa-convert'
import body from 'koa-better-body'
import fs from 'fs'
import config from '../config'
import { exec } from 'child_process'
import path from 'path'
import { Book, Setting, User } from '../models'
import { checkUserToken, checkAdminToken } from '../utils'
import { requestWxCode } from '../utils/weixin/wxCode'
import qiniuUpload from '../utils/qiniuUpload'
import { mongosync } from '../bin/mongosync'

export default function(router) {
  router.get('/api/get_text', async (ctx, next) => {
    let arr = ['读万卷书,行万里路。 ——顾炎武', '读过一本好书，像交了一个益友。 ——臧克家', '鸟欲高飞先振翅，人求上进先读书', '书籍是人类思想的宝库', '书山有路勤为径，学海无涯苦作舟']
    let date = new Date()
    let day = date.getDate() % 5
    ctx.body = { ok: true, text: arr[day] }
  })

  // 下载上传模板文件
  router.get('/api/download', async (ctx, next) => {
    const path = ctx.request.query.path
    ctx.attachment(decodeURI(path))
    await sendfile(ctx, path)
  })

  router.get('/help', async (ctx, next) => {
    await ctx.render('help', {
      title: '帮助与反馈'
    })
  })

  router.get('/notice', async (ctx, next) => {
    await ctx.render('notice', {
      title: '关注公众号'
    })
  })

  /**
   * 生成分享图片，并上传到七牛云
   * @method GET
   * @param {String} share_type 分享类型：chapter，book，weapp
   * @param {String}  book_id 书籍id
   * @param {String}  chapter_id 章节id，当type为chapter的时候
   * @param {String}  text 自定义的章节描述
   **/
  router.get('/api/get_share_img', async (ctx, next) => {
    const share_type = ctx.request.query.share_type
    const book_id = ctx.request.query.book_id
    // const canvas = new Canvas(300, 120) // 按照微信官方要求，长宽比5:4
    // const context = canvas.getContext('2d')
    // ctx.font = '14px "Microsoft YaHei"' // 统一使用微软雅黑字体
    const canvas = null
    const context = null
    let thisBook = null
    switch (share_type) {
      case 'chapter':
        // 查找书籍信息
        const { chapter_id, text } = ctx.request.query
        thisBook = await Book.findById(book_id, 'name img_url author').populate({
          path: 'chapters',
          match: { _id: chapter_id },
          options: { limit: 1 }
        })
        if (thisBook) {
          if (thisBook.chapters.length === 1 && thisBook.chapters[0]._id.toString() === chapter_id) {
            return new Promise((resolve, reject) => {
              // 将封面图片转成buffer格式，用于canvas绘制图片
              https.get(thisBook.img_url, imgRes => {
                let chunks = [] // 用于保存网络请求不断加载传输的缓冲数据
                let size = 0 // 保存缓冲数据的总长度
                imgRes.on('data', chunk => {
                  /**
                   * 在进行网络请求时，会不断接收到数据(数据不是一次性获取到的)
                   * node会把接收到的数据片段逐段的保存在缓冲区（Buffer）
                   * 这些数据片段会形成一个个缓冲对象（即Buffer对象）
                   * 而Buffer数据的拼接并不能像字符串那样拼接（因为一个中文字符占三个字节），
                   * 如果一个数据片段携带着一个中文的两个字节，下一个数据片段携带着最后一个字节，
                   * 直接字符串拼接会导致乱码，为避免乱码，所以将得到缓冲数据推入到chunks数组中，
                   * 利用下面的node.js内置的Buffer.concat()方法进行拼接
                   */
                  chunks.push(chunk)
                  size += chunk.length
                })
                imgRes.on('end', err => {
                  if (err) {
                    ctx.body = { ok: false, msg: '下载书籍封面图片失败' }
                    reject('下载书籍封面图片失败')
                    return
                  }
                  const buffer = Buffer.concat(chunks, size)
                  // 判断是否是一个buffer对象
                  if (Buffer.isBuffer(buffer)) {
                    const factionImg = new Canvas.Image()
                    factionImg.src = buffer
                    context.drawImage(factionImg, 12, 12, 60, 96)
                    context.textAlign = 'left'
                    context.font = 'bold 16px "Microsoft YaHei"'
                    context.fillText(thisBook.name, 84, 24, 204)
                    context.font = 'bold 14px "Microsoft YaHei"'
                    context.fillText('第' + thisBook.chapters[0].num + '章 ' + thisBook.chapters[0].name, 84, 44, 204)
                    context.font = 'normal 12px "Microsoft YaHei"'
                    let noSpaceContent = ''
                    // 是否使用自定义文字
                    if (text) {
                      noSpaceContent = text.replace(/(\n|\t|\r)/g, '')
                    } else {
                      // 去除content中的换行符
                      noSpaceContent = thisBook.chapters[0].content.replace(/(\n|\t|\r)/g, '')
                    }
                    const oneTextWidth = context.measureText('测').width
                    const oneLineMaxTextNumber = Math.ceil(204 / oneTextWidth)
                    // 小说描述最大行数
                    let maxLineNumber = 4
                    let current = 4
                    while (current > 0) {
                      let tmpText = noSpaceContent.substring(oneLineMaxTextNumber * (maxLineNumber - current), oneLineMaxTextNumber * (maxLineNumber + 1 - current))
                      // 最后一行文字显示省略号
                      if (current === 1) {
                        tmpText = tmpText.substring(0, tmpText.length - 2) + '...'
                      }
                      context.fillText(tmpText, 84, 62 + (maxLineNumber - current) * 15, 204)
                      current--
                    }
                    // 上传图片到七牛云
                    qiniuUpload(canvas.toBuffer(), 'mbook/share/' + uuid.v1() + '.png')
                      .then(res => {
                        ctx.body = { ok: true, msg: '分享图片导出成功', url: result.url }
                        resolve(next())
                      })
                      .catch(err => {
                        ctx.body = { ok: false, msg: '分享图片导出失败' }
                        reject('分享图片导出失败')
                      })
                  } else {
                    ctx.body = { ok: false, msg: '下载书籍封面图片失败' }
                    reject('下载书籍封面图片失败')
                    return
                  }
                })
              })
            })
          } else {
            ctx.body = { ok: false, msg: '找不到对应的章节' }
          }
        } else {
          ctx.body = { ok: false, msg: '找不到对应的书籍' }
        }
        break
      case 'book':
        thisBook = await Book.findById(book_id, 'name img_url author des')
        if (thisBook) {
          return new Promise((resolve, reject) => {
            // 将封面图片转成buffer格式，用于canvas绘制图片
            https.get(thisBook.img_url, imgRes => {
              let chunks = [] // 用于保存网络请求不断加载传输的缓冲数据
              let size = 0 // 保存缓冲数据的总长度
              imgRes.on('data', chunk => {
                chunks.push(chunk)
                size += chunk.length
              })
              imgRes.on('end', err => {
                if (err) {
                  ctx.body = { ok: false, msg: '下载书籍封面图片失败' }
                  reject('下载书籍封面图片失败')
                  return
                }
                const buffer = Buffer.concat(chunks, size)
                // 判断是否是一个buffer对象
                if (Buffer.isBuffer(buffer)) {
                  const factionImg = new Canvas.Image()
                  factionImg.src = buffer
                  context.drawImage(factionImg, 12, 12, 60, 96)
                  // 绘制图标
                  const nameIconBuffer = Buffer.from(
                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAvUlEQVQ4T+2TUQ0CMRBE3zlAAigAFBwSkAAOkICUk4CEOwWAAnAAEsi7bElp4CDhhw+aNE1nd2c37UzFl6vK6sfAFDgC5wHeRcRaz0QwAgR2wAzwvg/sGpiFk8BsZm6TCAwugU3WWWwFmNxEgWQuY+5tTtADxej3xFf4n+DXHrHUwcN/v/tG4yrrFErrAEVT6kCV1sA6RNfmXpDEBCdxX8ITKlFvzIFDNFL2vSpLgnxS/eAESfdPDTZE8JHRbzsWNxFxsDgaAAAAAElFTkSuQmCC',
                    'base64'
                  )
                  const authorIconBuffer = Buffer.from(
                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA30lEQVQ4T6WTAQ3CQAxF3xwgAQlIwAHgAAlIQAIScMBwgAQkgAMkkLdcl+Nyt5GsSbOwu77294+OhdFN1O+BXTq/A33tbgtwAVaAT+MMPNPzh1MDrIErsC06PoAj8Mrf1wAWmnbNw99CzDFqgA1wSt3yu06lJKVMAjy0iwWm4ehmKYvWEnXglvS6TPNQc6IEeNHCdzFuyHLBwj+hIQdYrNexrJrtsdwRkgNckBaF961vzAXbbHApAL5wcY76T9hIOSOg5X0L5pTKfcQEWpR/unNTKMMp+qk/0xxkOF8M+AIi6CgR4+ZD4AAAAABJRU5ErkJggg==',
                    'base64'
                  )
                  const classifyIconBuffer = Buffer.from(
                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABCklEQVQ4T32SARHCQAwErw6QAApAQiUgARwgAQl1QHGAA3BAcYAEJDDbyTFP+m1mmO/zucvlkkbzsZa0jeeXpHcttZnBHyTtJd3i3d99zq8R7CSdJEFSBmRnSUP5Z42AJCplyRCjhPdf1AgA5+oAVpK6/FYjQP4nVJTFIDXJogIeHyGVk2jjzvkXc1OgEr0ySgI/uKOsSmDnAZJ0l3RNubSAAufgx4ACg907OL6tgrurAyoN7SBgvrBneUzDI+PMk6FADwFGTcwJgHcBLyZbCHaJgKp5CtnDkcCJTnaPVGTziFqbqG49RhKeURG5xzDSe4/RGHiJkQLe0Ga5ByTxo+9STSkbIAUgHsm/Y/g+8fK69VMAAAAASUVORK5CYII=',
                    'base64'
                  )
                  const desIconBuffer = Buffer.from(
                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAzklEQVQ4T7WTAQ3CMBBF3xzgAByABCSAAyQgAQlIQAISJgEcgIM5gDzoLaRbyxLCJcuS9v7r79+t4cdqKvoTcANa4JD17YGLayWAYktALl4BR2BdAij2VMU25QB17m+ALncQYt82eFoJ4Hr7CVD0AMK+NrfJSR5V5NIDtKowxArOEdRI0KMALb2CmVBVgHdfFiDX5KwKMLhZAdCla/33CjtgXnBwT0EPHGjZ1A1xkZ4xhsMV4z0YJKn9jFe+RHGUY8NhqpXD9/VnmjAK75Ynhm08EQ04VoYAAAAASUVORK5CYII=',
                    'base64'
                  )
                  const nameIcon = new Canvas.Image()
                  nameIcon.src = nameIconBuffer
                  const authorIcon = new Canvas.Image()
                  authorIcon.src = authorIconBuffer
                  const classifyIcon = new Canvas.Image()
                  classifyIcon.src = classifyIconBuffer
                  const desIcon = new Canvas.Image()
                  desIcon.src = desIconBuffer

                  context.textAlign = 'left'
                  context.font = 'bold 16px "Microsoft YaHei"'
                  context.fillText(thisBook.name, 84, 24, 204)
                  context.font = 'bold 14px "Microsoft YaHei"'
                  context.fillText('第' + thisBook.chapters[0].num + '章 ' + thisBook.chapters[0].name, 84, 44, 204)
                  context.font = 'normal 12px "Microsoft YaHei"'
                  let noSpaceContent = ''
                  // 是否使用自定义文字
                  if (text) {
                    noSpaceContent = text.replace(/(\n|\t|\r)/g, '')
                  } else {
                    // 去除content中的换行符
                    noSpaceContent = thisBook.chapters[0].content.replace(/(\n|\t|\r)/g, '')
                  }
                  const oneTextWidth = context.measureText('测').width
                  const oneLineMaxTextNumber = Math.ceil(204 / oneTextWidth)
                  // 小说描述最大行数
                  let maxLineNumber = 4
                  let current = 4
                  while (current > 0) {
                    let tmpText = noSpaceContent.substring(oneLineMaxTextNumber * (maxLineNumber - current), oneLineMaxTextNumber * (maxLineNumber + 1 - current))
                    // 最后一行文字显示省略号
                    if (current === 1) {
                      tmpText = tmpText.substring(0, tmpText.length - 2) + '...'
                    }
                    context.fillText(tmpText, 84, 62 + (maxLineNumber - current) * 15, 204)
                    current--
                  }
                  // 上传图片到七牛云
                  qiniuUpload(canvas.toBuffer(), 'mbook/share/' + uuid.v1() + '.png')
                    .then(res => {
                      ctx.body = { ok: true, msg: '分享图片导出成功', url: result.url }
                      resolve(next())
                    })
                    .catch(err => {
                      ctx.body = { ok: false, msg: '分享图片导出失败' }
                      reject('分享图片导出失败')
                    })
                } else {
                  ctx.body = { ok: false, msg: '下载书籍封面图片失败' }
                  reject('下载书籍封面图片失败')
                  return
                }
              })
            })
          })
        } else {
          ctx.body = { ok: false, msg: '找不到对应的书籍' }
        }
        break
      case 'index':
        // 获取配置项中的图片地址
        ctx.body = { ok: true, msg: '获取分享图片成功', url: await Setting.getSetting('index_share_img') }
        break
      case 'friendQ':
        const shareId = ctx.request.query.share_id
        if (shareId) {
          let imgUrl = await requestWxCode(shareId)
          if (typeof imgUrl === 'string') {
            ctx.body = { ok: true, msg: '获取分享图片成功', img_url: imgUrl }
          } else {
            ctx.body = { ok: false, msg: '获取分享图片失败' }
          }
        } else {
          ctx.body = { ok: false, msg: '参数错误' }
        }
        break
      default:
        ctx.body = { ok: false, msg: '参数错误' }
        break
    }
  })

  // 获取个人阅读时长
  router.get('/api/read_time/my', async (ctx, next) => {
    let userid = await checkUserToken(ctx, next)
    if (userid) {
      const readTime = (await User.findById(userid, 'read_time')).read_time
      const minute = parseInt(readTime / (1000 * 60))
      // 可兑换个书币数
      const num = parseInt(minute * (10 / 60))
      ctx.body = { ok: true, minute, num, msg: '获取我的阅读时长成功' }
    }
  })

  // 兑换书币
  router.get('/api/read_time/exchange', async (ctx, next) => {
    let userid = await checkUserToken(ctx, next)
    if (userid) {
      const readTime = (await User.findById(userid, 'read_time')).read_time
      const minute = parseInt(readTime / (1000 * 60))
      // 可兑换个书币数
      const num = parseInt(minute * (10 / 60))
      const awardResult = await User.addAmount(userid, num, '阅读时长兑换奖励')
      if (awardResult) {
        const updateResult = await User.update({ _id: userid }, { $set: { read_time: 0 } })
        if (updateResult.ok === 1 && updateResult.nModified === 1) {
          ctx.body = { ok: true, msg: '兑换书币成功' }
        } else {
          await User.reduceAmount(userid, num)
          ctx.body = { ok: false, msg: '兑换书币失败' }
        }
      } else {
        ctx.body = { ok: false, msg: '发送书币失败' }
      }
      ctx.body = { ok: true, minute, num, msg: '获取我的阅读时长成功' }
    }
  })

  // 手动同步mongo数据库
  router.get('/api/mongosync', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'mongosync')
    if (userid) {
      let result = await mongosync()
      if (result === true) {
        ctx.body = { ok: true, msg: '同步成功' }
      } else {
        ctx.body = { ok: false, msg: '同步失败' }
      }
    }
  })

  // 手动更新书籍
  router.get('/api/update_book', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'update_book')
    if (userid) {
      exec(`npx runkoa ${path.join(process.cwd(), './spider/update.js')}`)
      ctx.body = { ok: true, msg: '更新成功', data: '爬虫开始执行，请确保芝麻代理余额充足' }
    }
  })

   // 上传图片
  router.post('/api/upload_img', convert(body()), async (ctx, next) => {
    const file = ctx.request.files[0] // 获取上传文件
    // const reader = fs.createReadStream(file.path) // 创建可读流
    const buffer = fs.readFileSync(file.path)
    const ext = file.name.split('.').pop() // 获取上传文件扩展名
    const name = uuid.v1()
    const key = `mbook/${name}.${ext}`
    try {
      const url = await qiniuUpload(buffer, key)
      ctx.body = { code: 0, msg: '上传图片成功', name, url: url }
    } catch (err) {
      ctx.body = { code: -1, msg: '上传图片失败' + err.toString() }
    }
  })
}
