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
// const createAdmin = require('./bin/createAdmin')
// const addUserSetting = require('./bin/addUserSetting')
const secret = 'mbook'
// error handler
onerror(app)
schedule.run()
// createAdmin()
// addUserSetting()

app.use(
  bodyparser({
    limit: '10mb',
    formLimit: '10mb',
    jsonLimit: '10mb',
    textLimit: '10mb'
  })
)
app.use(
  jwtKoa({ secret }).unless({
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
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
  if (ctx.response && ctx.response.body) debug('Return', ctx.response.body)
  if (ctx.response && ctx.response.body && !ctx.response.body.ok) reportError(new Error('接口返回ok:false'), { extra: { context: ctx } })
})

// cross
app.use(cors())

// routes
app.use(index.routes(), index.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err)
  reportError(err, { extra: { context: ctx } })
})

module.exports = app
