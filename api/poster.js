import qrImage from 'qr-image'
import qiniuUpload from '../utils/qiniuUpload'
import uuid from 'uuid'
import { Book } from '../models'
import { makeBookPoster } from '../utils/generatePoster'

export default function(router) {
  /**
   * 书籍分享海报渲染请求
   * 负责渲染海报，让无头浏览器下载到海报图片
   */
  router.get('/api/front/poster/book_preview', async ctx => {
    const { id } = ctx.request.query
    if (!id) {
      ctx.body = { ok: false, msg: '请指定书籍ID' }
      return
    }

    // 检查是否已经转化
    const thisBook = await Book.findById(id, '-source -classify_order -create_time -secret')
    if (!thisBook) {
      ctx.body = { ok: false, msg: '书籍不存在' }
      return
    }

    // 生成二维码
    let qrCodeImageUrl = 'https://file.lantingshucheng.com/mbook/fe6048c0-24cd-11ea-9cfa-9783ea5b9b50.png'
    try {
      const qrCode = qrImage.imageSync(`https://h5.lantingshucheng.com/#/pages/bookdetail/index?id=${id}`, { margin: 0 });
      qrCodeImageUrl = await qiniuUpload(qrCode, 'mbook/qrcode/' + uuid.v1() + '.png')
    } catch (err) {
      console.log('生成海报失败', err)
    }

    await ctx.render('posters/book', {
      title: '书籍分享海报',
      name: thisBook.name,
      author: thisBook.author,
      imgUrl: thisBook.img_url,
      qrCode: qrCodeImageUrl,
      des: thisBook.des
    })
  })

  /**
   * 获取书籍分享海报
   * 给客户端调用
   */
  router.get('/api/front/poster/book', async ctx => {
    const { id } = ctx.request.query
    if (!id) {
      ctx.body = { ok: false, msg: '请指定书籍ID' }
      return
    }

    // 生成海报
    try {
      const poster = await makeBookPoster(id);
      ctx.body = { ok: true, msg: 'ok', data: poster }
    } catch (err) {
      console.log('获取书籍海报失败', err)
      ctx.body = { ok: false, msg: '获取书籍海报失败' }
    }
  })
}
