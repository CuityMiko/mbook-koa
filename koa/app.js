import { request } from 'http';

const Koa = require('koa')
const app = new Koa()
const path = require('path')
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const jwt = require('jsonwebtoken')
const jwtKoa = require('koa-jwt')
const logger = require('koa-logger')
const restc = require('restc')
const noAuthPathArr = require('./config/noauth')
const index = require('./routes/index')
const secret = 'mbook'
// error handler
onerror(app)

app.use(bodyparser())
app.use(jwtKoa({ secret }).unless({
    path: noAuthPathArr //数组中的路径不需要通过jwt验证
}))
app.use(json())
app.use(logger())
app.use(restc.koa2())
app.use(require('koa-static')(__dirname + '/public'))
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

// routes
app.use(index.routes(), index.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
    console.error('server error', err, ctx)
});

module.exports = app
