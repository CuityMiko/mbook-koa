const router = require('koa-router')()
const createApi = require('../api')

// 创建api
createApi(router)

// 根目录
router.get('/', async (ctx, next) => {
  ctx.body = {
    ok: true,
    data: 'Welcome to mbook!'
  }
})

// 帮助页面
router.get('/help', async(ctx, next) => {
  await ctx.render('help', {
      title: '帮助'
  })
})

// 关于我们页面
router.get('/about_us', async(ctx, next) => {
  await ctx.render('aboutus', {
      title: '关于我们'
  })
})

// 关注公众号页面
router.get('/notice', async(ctx, next) => {
  await ctx.render('notice', {
      title: '关注公众号'
  })
})

// 活动页面
router.get('/activity/share', async(ctx, next) => {
  let userid = ctx.request.query.uid
  let shareid = ctx.request.query.sid
  await ctx.render('share', {
      title: '分享拿书币'
  })
})

module.exports = router
