/**
 * 用途: 连接mongodb并查找BookList和User两张表不对等的用户，完成他们的书架初始化工作
 * 创建时间: 2018/11/13 10:53
 * 创建人: 李迪康(andyliwr@outlook.com)
 */
import config from '../config'
import mongoose from 'mongoose'
import { User, BookList } from '../models'

mongoose.Promise = global.Promise
mongoose.connection.on('error', console.error.bind(console, 'Mongo connect failed'))
mongoose
  .connect(
    config.mongo_url,
    {
      user: config.mongo_user,
      pass: config.mongo_pass,
      auth: { authdb: config.mongo_dbname, authMechanism: 'MONGODB-CR' },
      useMongoClient: true
    }
  )
  .then(async db => {
    let current = 0
    let result = {}
    let final = []
    // 开始检测不对齐项
    while (result) {
      let user = await User.findOne({}, '_id', { skip: current })
      let booklist = await BookList.findOne({ userid: user._id })
      if (!booklist) {
        final.push(user._id)
        console.log(user._id + ' fail')
      } else {
        console.log(user._id + ' ok')
      }
      result = user
      if (current > 100) {
        break
      }
      current ++
    }
    // 修复
    if (final.length > 0) {
      console.log('Found abnormal items: ', final)
      final.forEach(async item => {
        await BookList.create({
          userid: mongoose.Types.ObjectId(item),
          books: []
        })
        console.log('fixed item: ', item)
      })
      console.log('Has fixed all abnormal items!')
    } else {
      console.log('Can not find any abnormal item')
    }
    process.exit(0)
  })
