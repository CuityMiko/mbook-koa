const router = require('koa-router')()
const createApi = require('../api')

// 创建api
createApi(router)

router.get('/', async (ctx, next) => {
  ctx.body = {
    ok: true,
    data: 'Hello world'
  }
})

module.exports = router
