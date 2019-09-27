const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const jwtKoa = require('koa-jwt')
const logger = require('koa-logger')
const cors = require('koa2-cors')
const noAuthPathArr = require('./config/noauth')
const index = require('./routes/index')
const schedule = require('./bin/shedule')
const { debug, reportError } = require('./utils')
const { initDatabase, jwtSecret } = require('./config')
const initDatabaseFunc = require('./bin/initDatabase')
// const createAdmin = require('./bin/createAdmin')
// const addUserSetting = require('./bin/addUserSetting')

// 是否清理数据库
if (initDatabase) initDatabaseFunc()

schedule.run()
// createAdmin()
// addUserSetting()

// error handler
onerror(app)

app.use(
  bodyparser({
    limit: '10mb',
    formLimit: '10mb',
    jsonLimit: '10mb',
    textLimit: '10mb'
  })
)
app.use(
  jwtKoa({ jwtSecret }).unless({
    path: noAuthPathArr //数组中的路径不需要通过jwt验证
  })
)
app.use(json())
app.use(logger())
// app.use(restc.koa2())
app.use(require('koa-static')(__dirname + '/public'))
app.use(
  views(__dirname + '/views', {
    extension: 'pug'
  })
)

// logger
// app.use(async (ctx, next) => {
//   const start = new Date()
//   await next()
//   const ms = new Date() - start
//   console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
//   if (ctx.response && ctx.response.body) debug('Return', ctx.response.body)
//   if (ctx.response && ctx.response.body && !ctx.response.body.ok) reportError(new Error('接口返回ok:false'), { extra: { context: ctx } })
// })

// cross
app.use(cors())

// routes
app.use(index.routes(), index.allowedMethods())

// error-handling
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
});

module.exports = app
