/**
 * 用途: 执行书城更新
 * 创建时间: 2019/04/16 10:53
 * 创建人: 李迪康(andyliwr@outlook.com)
 */
 import config from '../config'
 import mongoose from 'mongoose'
 import { updateBook } from '../spider/update'
 
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
     await updateBook()
   })
 
