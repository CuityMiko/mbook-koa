import mongoose from 'mongoose'
import { Good, User } from './index'

const BuySchema = new mongoose.Schema(
  {
    goodid: { type: mongoose.Schema.Types.ObjectId, ref: 'Good' },
    userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    chapter: Number, // 购买的章节数
    des: String, // 订单描述信息
    create_time: Date
  },
  { versionKey: false }
)

BuySchema.index({ goodid: 1, userid: 1 })

/**
 * 将字母id装换成mongodb的ObjectId对象的静态函数
 */
BuySchema.statics.transId = async function(id) {
  return mongoose.Types.ObjectId(id)
}

let Buy = mongoose.model('Buy', BuySchema)

export { Buy }
