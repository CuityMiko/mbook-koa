/**
 * 用途: 更改书籍模块的结构
 * 创建时间: 2018/12/26 10:53
 * 创建人: 李迪康(andyliwr@outlook.com)
 */
import config from '../config'
import mongoose from 'mongoose'
import { Book, Chapter } from '../models'

mongoose.Promise = global.Promise
mongoose.connection.on('error', console.error.bind(console, 'Mongo connect failed'))
mongoose
  .connect(
    config.mongo_url,
    {
      // user: config.mongo_user,
      // pass: config.mongo_pass,
      // auth: { authdb: config.mongo_dbname, authMechanism: 'MONGODB-CR' },
      // useMongoClient: true
    }
  )
  .then(async db => {
    console.log('mongodb connect success!')
    let current = 0
    // let total = 1
    let total = await Book.count()
    // 开始检测不对齐项
    console.log('Total book number: ' + total)
    while (current < total) {
      let book = await Book.find({}, '_id chapters name').skip(current).limit(1)
      if (book[0]) {
        console.log('Start to change the book ' + book[0].name + ' ...')
        for(let i=0; i<book[0].chapters.length; i++) {
          let chapter = await Chapter.findById(book[0].chapters[i].toString())
          if (chapter) {
            let updateResult = await Chapter.update({ _id: book[0].chapters[i].toString() }, { $set: { bookid: book[0]._id } })
            if (updateResult.ok === 1) {
              console.log('Modified chapter ' + chapter.name + ' success')
            } else {
              console.log('Modified chapter ' + chapter.name + ' fail ✘')
              process.exit(0);
            }
          } else {
            console.log('Not found the chapter ' + book[0].chapters[i].toString())
          }
        }
        console.log('Finished to change the book ' + book[0].name + ' ...')
        let updateResult = await Book.update({ _id: book[0]._id.toString() }, { $unset: { chapters: 1 } })
        if (updateResult.ok === 1) {
          console.log('Delete book\'s chapters field success')
        } else {
          console.log('Delete book\'s chapters field fail ✘')
        }
      }
      current ++
    }
    console.log('Finished all the update tasks!')
    process.exit(0);
  })
