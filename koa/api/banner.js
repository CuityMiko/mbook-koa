import { checkAdminToken } from '../utils'
import { Banner } from '../models'

export default function (router) {
    router.get('/api/banner/list', async (ctx, next) => {
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
      let total = await Banner.count()
      ctx.body = { ok: true, msg: '查询成功', total: total, list: result }
    })

    router.post('/api/banner', async (ctx, next) => {
      let userid = await checkAdminToken(ctx, next, 'banner_add')
      if(userid){
        let { show, type, url, img_url, des } = ctx.request.body
        let maxPriority = await Banner.count()
        let result = await Banner.create({
            priority: maxPriority + 1,
            show: show,
            type: type,
            url: url,
            img_url: img_url,
            des: des,
            create_time: new Date()
        })
        ctx.body = {ok: true, msg: '新增banner成功', data: result, total: maxPriority + 1}
      }
    })

    router.patch('/api/banner/:id', async (ctx, next) => {
      let id = ctx.params.id
      let result = await Banner.update({ _id: id },
      {
          $set: ctx.request.body
      })
      if(result.ok === 1){
          let newest = await Banner.findById(id)
          ctx.body = { ok: true, msg: '更新成功', data: newest }
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
