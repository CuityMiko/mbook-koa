import mongoose from 'mongoose'
import { Good, User } from './index'

const BuySchema = new mongoose.Schema({
  goodid: { type: mongoose.Schema.Types.ObjectId, ref: 'Good' },
  userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  yuebi_num: Number, // 获得阅币数
  des: String, //订单描述信息
  status: Number, // 订单完成状态, 0:初次创建
  create_time: Date
}, { versionKey: false })

BuySchema.statics.transId = async function (id) {
  return mongoose.Types.ObjectId(id)
}

let Buy = mongoose.model('Buy', BuySchema)

export { Buy }