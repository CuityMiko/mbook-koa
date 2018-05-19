import {User} from '../models'
const jwt = require('jsonwebtoken')
const Promise = require('bluebird')
const secret = 'mbook' // token秘钥

const jwtVerify = str => {
  return new Promise((resolve, reject) => {
      jwt.verify(str, secret, function(err, decoded){
          if(err){
            reject(err)
            return
          }
          resolve(decoded)
      })
  })
}

// 检查用户接口的token值是否有效，如果有效返回userid, 否则报无效token的错误
const checkUserToken = async (ctx, next) => {
  if(ctx.header.authorization && ctx.header.authorization.split(' ').length === 2){
    let token = ctx.header.authorization.split(' ')[1]
    if(token){
      return new Promise((resolve, reject) => {
        jwt.verify(token, secret, async function(err, decoded){
          if(err){
            ctx.status = 401
            ctx.body = { ok: false, msg: '无效token', err: err, authfail: true}
            await next()
            resolve(null)
            return
          }
          if(decoded && decoded.userid){
            resolve(decoded.userid)
          }else{
            resolve(null)
            ctx.status = 401
            ctx.body = {ok: false, msg: '无效token', authfail: true}
            await next()
          }
        })
      })
    } else {
      ctx.status = 401
      ctx.body = {ok: false, msg: '无效token', authfail: true}
      await next()
    }
  } else {
    ctx.status = 401
    ctx.body = { ok: false, msg: '无效token', authfail: true }
    await next()
  }
}

/**
 * 检查后台接口的token值是否有效（必须拥有当前权限，并且identity为2）如果有效则返回true，否则报相应的错误
 * @param {Object} ctx 
 * @param {Object} next 
 * @param {String} permission 权限名称
 */
const checkAdminToken = async (ctx, next, permission) => {
  if(ctx.header.authorization){
    let token = ctx.header.authorization.split(' ')[1]
    if(token){
      return new Promise((resolve, reject) => {
        jwt.verify(token, secret, async function(err, decoded){
          if(err){
            ctx.status = 401
            ctx.body = {ok: false, msg: '无效token', err: err}
            await next()
            resolve(null)
            return
          }
          if(decoded && decoded.userid){
            // 权限判断
            let user = await User.findById(decoded.userid, 'identity permission')
            let access = user.permission.some(item => {
              return item === permission
            })
            // test
            access = true
            if(access && user.identity === 2){
              resolve(decoded.userid)
            }else{
              resolve(null)
              ctx.status = 403
              ctx.body = {ok: false, msg: '您没有该权限'}
              await next()
            }
          }else{
            resolve(null)
            ctx.status = 401
            ctx.body = {ok: false, msg: '无效token'}
            await next()
          }
        })
      })
    } else {
      ctx.status = 401
      ctx.body = {ok: false, msg: '无效token'}
      await next()
    }
  }else{
    ctx.status = 401
    ctx.body = {ok: false, msg: '无效token'}
    await next()
  }
}

module.exports = {
  jwtVerify: jwtVerify,
  checkUserToken: checkUserToken,
  checkAdminToken: checkAdminToken
}
