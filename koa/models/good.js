import mongoose from 'mongoose'
import { Book } from './index'

const GoodSchema = new mongoose.Schema({
  bookid: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
  type: Number, // mode=1书本按照章节计算，mode=2书本限时免费， mode=3书本限章节免费
  prise: Number,
  limit_start_time: Date,
  limit_end_time: Date,
  limit_chapter: Number,
  create_time: Date
}, { versionKey: false })

/**
 * 将字母id装换成mongodb的ObjectId对象的静态函数
 */
GoodSchema.statics.transId = async function (id) {
  return mongoose.Types.ObjectId(id)
}

let Good = mongoose.model('Good', GoodSchema)

export { Good }
