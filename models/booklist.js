import mongoose from 'mongoose'

const BookListSchema = new mongoose.Schema(
  {
    userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    books: [
      {
        bookid: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
        read: Object, // {"num": 2, "top": 1, "scroll": 0}
        rss: { type: Number, default: 0 }, // 是否订阅了本书籍
        time: Date
      }
    ], // 所有书籍
    create_time: Date
  },
  { versionKey: false }
)

/**
 * 将字母id装换成mongodb的ObjectId对象的静态函数
 */
BookListSchema.statics.transId = async function(id) {
  return mongoose.Types.ObjectId(id)
}

let BookList = mongoose.model('BookList', BookListSchema)

export { BookList }
