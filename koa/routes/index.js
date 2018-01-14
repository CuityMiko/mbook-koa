const router = require('koa-router')()
const createApi = require('../api')

// 创建api
createApi(router)

// 根目录
router.get('/', async (ctx, next) => {
  ctx.body = {
    ok: true,
    data: 'Hello world'
  }
})

// 帮助页面
router.get('/help', async(ctx, next) => {
  await ctx.render('help', {
      title: '帮助'
  })
})

module.exports = router
