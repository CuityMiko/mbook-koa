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
    try {
      console.log('mongodb connect success!')
      let current = 0
      let total = await Book.count()
      console.log('Total book number: ' + total)
      while (current < total) {
        let book = await Book.find({}, '_id chapters name').skip(current).limit(1)
        if (book[0]) {
          console.log('Start to change the book ' + book[0].name + ' ...')
          console.warn('caonima', typeof book[0].chapters, (book[0].chapters instanceof Array), (book[0].chapters instanceof Array) && (book[0].chapters.length > 0));
          if ((book[0].chapters instanceof Array) && (book[0].chapters.length > 0)) {
            for(let i=0; i<book[0].chapters.length; i++) {
              let chapter = await Chapter.findById(book[0].chapters[i].toString())
              if (chapter) {
                let updateResult = await Chapter.update({ _id: book[0].chapters[i].toString() }, { $set: { bookid: book[0]._id, name: chapter.name.replace(/^[：，.、]+/g, '') } })
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
            let updateResult = await Book.update({ _id: book[0]._id.toString() }, { $unset: { chapters: 1 } })
            console.log(updateResult);
            if (updateResult.ok === 1) {
              console.log('Delete book\'s chapters field success')
            } else {
              console.log('Delete book\'s chapters field fail ✘')
            }
          }
          console.log('Finished to change the book ' + book[0].name + ' ...')
        }
        current ++
      }
      console.log('Finished all the update tasks!')
      process.exit(0);
    } catch (err) {
      console.log('Error: ' + err)
    }
  })
