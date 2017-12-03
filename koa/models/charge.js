import mongoose from 'mongoose'

const ChargeSchema = new mongoose.Schema({
  pay_money: Number, // 应支付金额
  yuebi_num: Number, // 获得阅币数
  benefit: Number,
  limit_start_time: Date, // 限时优惠的起始时间
  limit_end_time: Date, // 限时优惠的结束时间
  create_time: Date
}, { versionKey: false })

ChargeSchema.statics.transId = async function (id) {
  return mongoose.Types.ObjectId(id)
}

let Charge = mongoose.model('Charge', ChargeSchema)

export { Charge }