const router = require('koa-router')()
const createApi = require('../api')
const models = require('../models')
const { Notice } = models

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
router.get('/help', async (ctx, next) => {
  await ctx.render('help', {
    title: '帮助'
  })
})

// 关于我们页面
router.get('/about_us', async (ctx, next) => {
  await ctx.render('aboutus', {
    title: '关于我们'
  })
})

// 关注公众号页面
router.get('/notice', async (ctx, next) => {
  await ctx.render('notice', {
    title: '关注公众号'
  })
})

// 通知详情页面
router.get('/notice-detail/:id', async (ctx, next) => {
  const id = ctx.request.params.id
  const thisNotice = await Notice.findById(id)
  if (thisNotice) {
    await ctx.render('notice-detail', {
      title: thisNotice.title,
      content: thisNotice.content
    })
  } else {
    await ctx.render('notice-detail', {
      title: '通知详情',
      content: '页面不存在'
    })
  }
})

// 活动页面
router.get('/activity/share', async (ctx, next) => {
  let userid = ctx.request.query.uid
  let shareid = ctx.request.query.sid
  await ctx.render('share', {
    title: '分享拿书币'
  })
})

// 活动页面
router.get('/link', async (ctx, next) => {
  await ctx.render('link', {
    title: '言情微阅读'
  })
})

module.exports = router
