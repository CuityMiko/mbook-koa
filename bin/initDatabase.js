/**
 * 用途: 初始化数据库
 * 创建时间: 2019/09/25 10:53
 * 创建人: 李迪康(andyliwr@outlook.com)
 */
import config from '../config'
import mongoose from 'mongoose'
import { User } from '../models'

async function initDatabse() {
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
  mongoose.connect(dbUri, function() {
    const db = mongoose.connection.db
    db.collections(function(err, collections) {
      const collectionsWithoutSystem = collections.filter(connecollectionction => collection.collectionName.split('.')[0] !== 'system')
      collectionsWithoutSystem.forEach(collection => {
        
      })
      async.forEach(
        collectionsWithoutSystem,
        function(collection, done) {
          collection.remove({}, function(err) {
            if (err) return done(err)
            done(null)
          })
        },

        function(err) {
          mongoose.connection.close(function() {})
        }
      )
    })
  })
  mongoose.connect(config.mongo_url, connectParams).then(async db => {
    console.log('开始清空数据...')
    try {
      console.log(db.collections)
      for (let dbItem in db.collections) {
        console.log(dbItem)
        await dbItem.drop()
      }
      console.log('开始创建管理员')
      // User.create({
      //   username: 'mbookLidikang', // 用户名就使用昵称
      //   password: 'lidikang666',
      //   avatar: 'https://wx.qlogo.cn/mmopen/vi_32/SWkKED0AiblN0sGZT4zBUXxncnZ3fslHDcNDzIdv8bc8ibmfmGjEbyvnUgLOUggNs0fgF2RSNAicm4CpK5o7kDJXQ/0',
      //   mobile: '', // 手机号码
      //   identify: 2, // 区分用户是普通用户还是系统管理员
      //   openid: '', // 小程序openid
      //   amount: 0, //
      //   is_active: true,
      //   setting: {
      //     updateNotice: true,
      //     autoBuy: true,
      //     reader: {
      //       fontSize: 36,
      //       fontFamily: '使用系统字体',
      //       bright: 1,
      //       mode: '默认', // 模式,
      //       overPage: 1 // 翻页模式
      //     }
      //   },
      //   read_time: 0,
      //   create_time: new Date(),
      //   last_login_time: new Date(),
      //   login_times: 0
      // })
    } catch (err) {
      console.log('Error: ' + err)
    }
  })
}

export default initDatabse
