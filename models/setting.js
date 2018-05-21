import mongoose from 'mongoose'

const SettingSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    key: { type: String, unique: true, required: true }, // 设置项键值名
    value: { type: Object, unique: true, required: true, default: '' }, // 设置项键值
    des: { type: String, default: '' }, // 设置项描述
    create_time: Date // 创建时间
  },
  { versionKey: false }
)

/**
 * 将字母id装换成mongodb的ObjectId对象的静态函数
 */
SettingSchema.statics.transId = async function(id) {
  return mongoose.Types.ObjectId(id)
}

/**
 * 获取设置项的值
 */
SettingSchema.statics.getSetting = async function(key) {
  const thisSetting = await this.findOne({ key }, 'value')
  if (thisSetting) {
    return thisSetting.value
  } else {
    return ''
  }
}

let Setting = mongoose.model('Setting', SettingSchema)

export { Setting }