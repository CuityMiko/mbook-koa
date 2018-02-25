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
const checkUserToken = str => {
  return
}

/**
 * 检查后台接口的token值是否有效（必须拥有当前权限，并且identity为2）如果有效则返回true，否则报相应的错误
 * @param {Object} ctx 
 * @param {String} permission 权限名称
 */
const checkAdminToken = (ctx, permission) => {
  let token = ctx.header.authorization
  if(token){
    return new Promise((resolve, reject) => {
      jwt.verify(token, secret, async function(err, decoded){
        if(err){
          reject(err)
          ctx.throw(-401)
          return
        }
        if(decoded && decoded.userid){
          // 权限判断
          let user = await User.findById(decoded.userid, 'identity permission')
          let access = user.permission.some(item => {
            return item === permission
          })
          if(access && user.identity === '2'){
            resolve(decoded.userid)
          }else{
            ctx.throw(-403)
          }
        }else{
          ctx.throw(-401)
        }
      })
    })
  } else {
    ctx.throw(-401)
  }
}

module.exports = {
  jwtVerify: jwtVerify,
  checkUserToken: checkUserToken,
  checkAdminToken: checkAdminToken
}
