/**
 * 用途: 更改admin密码
 * 创建时间: 2019/06/17 10:53
 * 创建人: 李迪康(andyliwr@outlook.com)
 */
import { MONGO_AUTH, MONGO_URL, MONGO_DBNAME, MONGO_USER, MONGO_PASS } from '../config'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt-nodejs'
import { User } from '../models'


const SALT_WORK_FACTOR = 10

mongoose.Promise = global.Promise
mongoose.connection.on('error', console.error.bind(console, 'Mongo connect failed'))
let connectParams = { useMongoClient: true }
if (MONGO_AUTH) {
  connectParams = {
    user: MONGO_USER,
    pass: MONGO_PASS,
    auth: { authdb: MONGO_DBNAME, authMechanism: 'MONGODB-CR' },
    useMongoClient: true
  }
}
mongoose
  .connect(MONGO_URL, connectParams)
  .then(async db => {
    console.log('开始加密')
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
          'new password',
          salt,
          function() {},
          function(err, hash) {
            console.log('加密完成', err, hash)
            if (err) return next(err)
            // 使用hash覆盖明文密码
            User.update({ username: 'mbookLidikang' }, { $set: { password: hash  } }).then(res => {
              console.log('密码修改成功', res)
            }).catch(err => {
              console.log('密码修改失败', err)
            })
          }
        )
      })
    } catch (err) {
      console.log('Error: ' + err)
    }
  })
