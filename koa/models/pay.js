import mongoose from 'mongoose'
import { Good, User } from './index'

const PaySchema = new mongoose.Schema({
  chargeids: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Charge' }
  ],
  userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pay_money: Number, // 应支付金额
  yuebi_num: Number, // 获得阅币数
  status: Number, // 订单完成状态, 0:初次创建
  create_time: Date
}, { versionKey: false })

PaySchema.statics.transId = async function (id) {
  return mongoose.Types.ObjectId(id)
}

let Pay = mongoose.model('Pay', PaySchema)

export { Pay }
