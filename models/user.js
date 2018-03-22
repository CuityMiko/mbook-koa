import mongoose from 'mongoose'
import bcrypt from 'bcrypt-nodejs'
const SALT_WORK_FACTOR = 10

const UserSchema = new mongoose.Schema({
  username: {type: String, unique: true , required: true},
  password: String,
  avatar: String,
  identity: Number, // 区分用户是普通用户还是系统管理员，1：小程序用户，2：系统管理员
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
  is_active: Boolean, // 后台管理账号是否激活标志
  permission: [], // 后台管理系统权限配置字段
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

// 存储密码之前将其转换成hash值
UserSchema.pre('save', function (next) {
  var user = this
  //产生密码hash当密码有更改的时候(或者是新密码)
  if (!user.isModified('password')) return next();
  // 产生一个salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
    if (err) return next(err)
    /**
     * 结合salt产生新的hash
     * @param data — Data to be encrypted
     * @param salt — Salt to be used in encryption
     * @param progressCallback — Callback to be fired multiple times during the hash calculation to signify progress
     * @param callback — Callback with error and hashed result, to be fired once the data has been encrypted
     */
    bcrypt.hash(user.password, salt, function(){}, function (err, hash) {
      if (err) return next(err)
      // 使用hash覆盖明文密码
      user.password = hash
      next()
    })
  })
})

/**
 * 检验用户密码的合法性的实例方法
 */
UserSchema.methods.checkPassword = function (candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
    if (err) return cb(err)
    cb(null, isMatch)
  })
}

let User = mongoose.model('User', UserSchema)

export { User }
