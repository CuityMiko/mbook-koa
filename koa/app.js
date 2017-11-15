const Koa = require('koa')
const app = new Koa()
const path = require('path')
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const session = require('koa-session2')
const Store = require("./utils/store")

const index = require('./routes/index')

// error handler
onerror(app)

app.use(bodyparser())
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))
app.use(session({
    key: "mbook",
    maxAge: 2 * 60 * 60 * 1000,
    store: new Store()
}));
app.use(views(__dirname + '/views', {
    extension: 'pug'
}))

// logger
app.use(async(ctx, next) => {
    const start = new Date()
    await next()
    const ms = new Date() - start
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// user info
app.use(async(ctx, next) => {
    ctx.state.user = ctx.session.user
    await next()
})

// routes
app.use(index.routes(), index.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
    console.error('server error', err, ctx)
});

module.exports = app