import mongoose from 'mongoose'
import { User, Book } from './index'

const CommentSchema = new mongoose.Schema(
  {
    bookid: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' }, // 书评对应的书籍id
    father: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // 是否展示,
    content: String, // 展示时的布局方式
    like_persons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    is_top: Boolean, // 是否置顶
    create_time: Date
  },
  { versionKey: false }
)

CommentSchema.index({ userid: 1, bookid: 1 })

/**
 * 将字母id装换成mongodb的ObjectId对象的静态函数
 */
CommentSchema.statics.transId = async function(id) {
  return mongoose.Types.ObjectId(id)
}

let Comment = mongoose.model('Comment', CommentSchema)

export { Comment }
