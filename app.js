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
// const createAdmin = require('./bin/createAdmin')
// const addUserSetting = require('./bin/addUserSetting')
const Sentry = require('@sentry/node');
const secret = 'mbook'
// 安装日志上传工具
Sentry.init({ dsn: 'https://b16f63d122694fa3b607a81c285fb900@sentry.io/1310873' })
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
})

// cross
app.use(cors())

// routes
app.use(index.routes(), index.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err)
  // 上传错误日志
  Sentry.configureScope((scope) => {
    scope.setExtra("context", ctx);
  });
  Sentry.captureException(err, function(err, eventId) {
    console.log('Reported error ' + eventId)
  })
})

module.exports = app
