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
    console.log('mongodb connect success!')
    let current = 20000
    let total = await User.count()
    let finalArr = ['5bea54cc93431722e92561b1']
    // 开始检测不对齐项
    console.log('Total user number: ' + total)
    while (current < total) {
      let user = await User.find({}, '_id').skip(current).limit(1)
      let booklist = await BookList.findOne({ userid: user[0]._id })
      if (!booklist) {
        finalArr.push(user[0]._id)
        console.log(user[0]._id + ' fail')
      } else {
        console.log(user[0]._id + ' ok')
      }
      current ++
    }
    if (finalArr.length > 0) {
      console.log('Found abnormal items: ', finalArr)
      finalArr.forEach(async item => {
        let tmpBooklist =  await BookList.create({
          userid: mongoose.Types.ObjectId(item),
          books: []
        })
        console.log('fixed item: ', item)
      })
    } else {
      console.log('Can not find any abnormal item')
    }
    //process.exit(0)
  })
