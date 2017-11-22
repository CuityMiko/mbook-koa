import mongoose from 'mongoose'

const BookListSchema = new mongoose.Schema({
  userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  books: [{
    bookid: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
    read: Object, // {"num": 2, "page": 1}
    index: Number
  }], // 所有书籍
  create_time: Date
}, { versionKey: false })

BookListSchema.statics.transId = async function (id) {
  return mongoose.Types.ObjectId(id)
}

let BookList = mongoose.model('BookList', BookListSchema)

export { BookList }
