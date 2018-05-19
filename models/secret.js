import mongoose from 'mongoose'

const SecretSchema = new mongoose.Schema(
  {
    userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    bookid: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
    secret: { type: String, unique: true },
    active: Boolean, // 秘钥是否被激活
    create_time: Date // 创建时间
  },
  { versionKey: false }
)

/**
 * 将字母id装换成mongodb的ObjectId对象的静态函数
 */
SecretSchema.statics.transId = async function(id) {
  return mongoose.Types.ObjectId(id)
}

/**
 * 获取设置项的值
 */
SecretSchema.statics.getSetting = async function(key) {
  const thisSetting = await this.findOne({ key }, 'value')
  if (thisSetting) {
    return thisSetting.value
  } else {
    return ''
  }
}

let Secret = mongoose.model('Secret', SecretSchema)

export { Secret }
