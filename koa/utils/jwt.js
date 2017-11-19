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

module.exports = jwtVerify
