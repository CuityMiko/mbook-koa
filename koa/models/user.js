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

let User = mongoose.model('User', UserSchema)

export { User }
