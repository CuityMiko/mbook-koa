import mongoose from 'mongoose'
import { debug } from '../utils'

const PaySchema = new mongoose.Schema(
  {
    chargeids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Charge' }],
    userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pay_money: Number, // 应支付金额
    yuebi_num: Number, // 获得阅币数
    status: Number, // 订单完成状态, 0:初次创建，1：支付成功，2:支付失败，3: 订单取消， 4异常错误
    des: [], // 额外说明
    create_time: Date
  },
  { versionKey: false }
)

/**
 * 将字母id装换成mongodb的ObjectId对象的静态函数
 */
PaySchema.statics.transId = async function(id) {
  return mongoose.Types.ObjectId(id)
}

/**
 * 更新支付订单状态值的静态函数
 * @param {String} id 支付订单id
 * @param {Number} num 状态值
 */
PaySchema.statics.updateStatus = async function(id, num) {
  /**
   * 验证num的合法性
   * num = 0，初次创建订单
   * num = 1，订单支付成功
   * num = 2, 订单支付失败
   * num = 3, 订单取消
   * num = 4, 出现异常错误
   */
  if (num === 0 || num === 1 || num === 2 || num === 3) {
    let updateResult = await this.update({ _id: id }, { status: num })
    if (updateResult.ok === 1) {
      return true
    } else {
      debug('更新支付订单状态值失败', { id, num, err: updateResult })
      return false
    }
  } else {
    debug('更新支付订单的状态值不合法', { id, num })
    return false
  }
}

/**
 * 更新支付说明的静态方法
 * @param {String} id 支付订单id
 * @param {String} des 说明文字
 * @param {Number} type 1: 更新时覆盖原来说明 ，2: 更新时添加新的说明至末尾
 */
PaySchema.statics.updateDes = async function(id, des, type) {
  if (id && des) {
    if (type === 2) {
      let updateResult = await this.update({ _id: id }, { $addToSet: { des: des } })
      if (updateResult.ok === 1) {
        return true
      } else {
        debug('更新支付说明失败', { id, des, type, err: updateResult })
        return false
      }
    } else {
      let updateResult = await this.update({ _id: id }, { des: des })
      if (updateResult.ok === 1) {
        return true
      } else {
        debug('更新支付说明失败', { id, des, type, err: updateResult })
        return false
      }
    }
  } else {
    debug('更新支付说明时参数错误', { id, des, type })
    return false
  }
}

let Pay = mongoose.model('Pay', PaySchema)

export { Pay }
