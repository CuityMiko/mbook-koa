import { Banner } from '../models'

export default function (router) {
    router.get('/api/get_banner', async (ctx, next) => {
        // 获取url参数
        let result = await Banner.getBanner()
        ctx.body = { ok: true, msg: '获取banner成功', list: result }
    })

    router.get('/api/banner', async (ctx, next) => {
      // 获取url参数
      let { page, limit } = ctx.request.query
      if(page){
          page = parseInt(page)
          if(page < 1){
              page = 1
          }
      }else{
          page = 1
      }
      if(limit){
          limit = parseInt(limit)
      }else{
          limit = 10
      }
      let result = await Banner.find().skip((page - 1) * limit).limit(limit)
      ctx.body = { ok: true, msg: '查询成功', list: result }
    })

    router.post('/api/banner', async (ctx, next) => {
      let { priority, show, type, url, img_url, des } = ctx.request.body
      let result = await Banner.create({
          priority: priority,
          show: show,
          type: type,
          url: url,
          img_url: img_url,
          des: des,
          create_time: new Date()
      })
      ctx.body = result
    })

    router.put('/api/banner/:id', async (ctx, next) => {
      let id = ctx.params.id
      let { priority, show, type, url, img_url, des } = ctx.request.body
      let result = await Banner.update({ _id: id },
      {
          $set: {
              priority: priority,
              show: show,
              type: type,
              url: url,
              img_url: img_url,
              des: des,
          }
      })
      if(result.ok === 1 && result.nModified === 1){
          ctx.body = { ok: true, msg: '更新成功' }
      }else{
          ctx.body = { ok: false, msg: '更新失败', data: result }
      }
    })

    router.delete('/api/banner/:id', async (ctx, next) => {
        let id = ctx.params.id
        let result = await Banner.remove({ _id: id })
        if(result.result.ok === 1){
            ctx.body = { ok: true, msg: '删除成功' }
        }else{
            ctx.body = { ok: false, msg: '删除失败', data: result.result }
        }
    })
}
