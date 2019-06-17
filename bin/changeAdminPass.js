/**
 * 用途: 更改admin密码
 * 创建时间: 2019/06/17 10:53
 * 创建人: 李迪康(andyliwr@outlook.com)
 */
import config from '../config'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt-nodejs'
import { User } from '../models'


const SALT_WORK_FACTOR = 10

mongoose.Promise = global.Promise
mongoose.connection.on('error', console.error.bind(console, 'Mongo connect failed'))
let connectParams = { useMongoClient: true }
if (config.mongo_auth) {
  connectParams = {
    user: config.mongo_user,
    pass: config.mongo_pass,
    auth: { authdb: config.mongo_dbname, authMechanism: 'MONGODB-CR' },
    useMongoClient: true
  }
}
mongoose
  .connect(config.mongo_url, connectParams)
  .then(async db => {
    try {
      // 产生一个salt
      bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err)
        /**
         * 结合salt产生新的hash
         * @param data — Data to be encrypted
         * @param salt — Salt to be used in encryption
         * @param progressCallback — Callback to be fired multiple times during the hash calculation to signify progress
         * @param callback — Callback with error and hashed result, to be fired once the data has been encrypted
         */
        bcrypt.hash(
          '4TFTyeSQCSXaPZvN',
          salt,
          function() {},
          function(err, hash) {
            if (err) return next(err)
            // 使用hash覆盖明文密码
            User.update({ password: hash }, { username: 'mbookLidikang' }).then(res => {
              console.log('密码修改成功', res)
            }).catch(err => {
              console.log('密码修改失败', err)
            })
            user.password = hash
          }
        )
      })
      process.exit(0)
    } catch (err) {
      console.log('Error: ' + err)
    }
  })