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

PaySchema.statics.updateStatus = async function (id, num) {
  /**
   * 验证num的合法性
   * num = 0，初次创建订单
   * num = 1，订单支付成功
   * num = 2, 订单支付失败
   * num = 3, 订单取消
   */
  if(num === 0 || num === 1 || num === 2 || num === 3){
    let updateResult = await this.update({_id: id}, {status: num})
    if(updateResult.ok === 1){
      return true
    }else{
      return false
    }
  }else{
    console.log('updateStatus num值不合法 num: ' + num)
    return false
  }
}

let Pay = mongoose.model('Pay', PaySchema)

export { Pay }
