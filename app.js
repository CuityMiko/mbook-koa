const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const cors = require('koa2-cors')
const url = require('url')
const validator = require('validator')
const index = require('./routes/index')
const schedule = require('./bin/shedule')
const { reportError, pathMatch, jwtVerify } = require('./utils')
const { INIt_DATABASE, DOMAIN_WHITE_LIST } = require('./config')
const { everyBodyCanAccess, authenticatedAccess } = require('./config/auth')
const initDatabaseFunc = require('./bin/initDatabase')

// 是否清理数据库
if (INIt_DATABASE) initDatabaseFunc()
// 定时任务开始执行
schedule.run()

// 错误处理
onerror(app)

// 加大上传大小限制
app.use(
  bodyparser({
    limit: '10mb',
    formLimit: '10mb',
    jsonLimit: '10mb',
    textLimit: '10mb'
  })
)

app.use(require('koa-static')(__dirname + '/public'))

// JWT解析
app.use(async (ctx, next) => {
  const token = ctx.header.authorization || ''
  if (token && validator.isJWT(token)) {
    try {
      const tokenInfo = await jwtVerify(token)
      ctx.state.user = tokenInfo
    } catch(err) {
      // 上报错误
      reportError('JWT解析错误--' + err.toString(), err, {
        priority: '紧急',
        category: '服务器500',
        extra: { url: `${ctx.method} ${ctx.url}`, query: JSON.stringify(ctx.request.query), body: JSON.stringify(ctx.request.body) }
      })
    }
  }
  await next()
})

// 权限校验
app.use(async (ctx, next) => {
  // 检查域名如果域名在白名单中自动加上跨域请求头
  const origin = ctx.request.headers.origin
  if (DOMAIN_WHITE_LIST.indexOf(origin) > -1) {
    ctx.set('Access-Control-Allow-Origin', origin)
  }
  // 检查当前请求是否需要检查权限
  const currentPath = `${ctx.method} ${url.parse(ctx.url).pathname}`
  const isEveryBodyCanAccess = everyBodyCanAccess.some(item => {
    return pathMatch(item, currentPath)
  })
  // 跳过options请求
  if (ctx.method === 'OPTIONS') {
    await next()
    return
  }
  // 跳过任何人可以访问的请求
  if (isEveryBodyCanAccess) {
    await next() // 200放行
    return
  }
  // 如果该请求只允许认证用户访问
  const isAuthenticatedAccess = authenticatedAccess.some(item => {
    return pathMatch(item, currentPath)
  })
  if (isAuthenticatedAccess && ctx.state.user) {
    await next() // 200放行
    return
  } else {
    ctx.status = 401 // 401拒绝
    console.log(`${ctx.method} ${ctx.url} - 401 Unauthorized`)
  }
})

app.use(json())
app.use(logger())
app.use(
  views(__dirname + '/views', {
    extension: 'pug'
  })
)

// 跨域
app.use(cors())

// 路由
app.use(index.routes(), index.allowedMethods())

// 错误处理
app.on('error', (err, ctx) => {
  console.log('server error', err)
  reportError('服务器500错误--' + err.toString(), err, {
    priority: '紧急',
    category: '服务器500',
    extra: { url: `${ctx.method} ${ctx.url}`, query: JSON.stringify(ctx.request.query), body: JSON.stringify(ctx.request.body) }
  })
})
process.on('unhandledRejection', reason => {
  console.log('捕获到一个错误')
  console.error(reason)
  reportError('未处理的Promise错误--' + reason.toString(), reason, {
    priority: '紧急',
    category: '服务器500'
  })
})

module.exports = app
