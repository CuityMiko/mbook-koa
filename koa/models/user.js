import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  avatar: String,
  identity: Number, // 区分用户是普通用户还是系统管理员
  openid: String, // 小程序openid
  // unionid: String, // 小程序unionid
  amount: 0, // 书币数量
  setting: {
    updateNotice: Boolean,
    reader: {
      fontSize: Number,
      fontFamily: String,
      bright: Number,
      mode: String, // 模式
    }
  },
  create_time: Date
}, { versionKey: false })

/**
 * 增加用户书币数的静态函数
 * @param {String} 用户id
 * @param {Number} 需要增加的阅币数
 */
UserSchema.statics.addAmount = async function (userid, num) {
  if(userid && num){
    let current = await this.findById(userid)
    let updateResult = await this.update({ _id: userid }, { $set: { amount: parseInt(current.amount + num) } }).sort({priority: -1}).limit(3)
    if(updateResult.ok == 1 && updateResult.nModified == 1){
      return true
    }else{
      return false
    }
  }else{
    return false
  }
}

/**
 * 减少用户书币数的静态函数
 * @param {String} 用户id
 * @param {Number} 需要减少的阅币数
 */
UserSchema.statics.reduceAmount = async function (userid, num) {
  if(userid && num){
    let current = await this.findById(userid)
    let amount = parseInt(current.amount - num)
    if(amount >= 0){
      let updateResult = await this.update({ _id: userid }, { $set: { amount: amount } }).sort({priority: -1}).limit(3)
      if(updateResult.ok == 1 && updateResult.nModified == 1){
        return true
      }else{
        return false
      }
    }else{
      return false
    }
  }else{
    return false
  }
}

let User = mongoose.model('User', UserSchema)

export { User }
