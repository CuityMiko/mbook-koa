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
  // 支持一次性查询多个
  let keys = key.split('|')
  let result = {}
  let count = 0
  for (let i = 0; i < keys.length; i++) {
    let current = await this.findOne({ key: keys[i] }, 'value')
    result[keys[i]] = current ? current.value : ''
    count++
  }
  if (result && count === 1) {
    return result[keys[0]]
  } else if (result && count > 1) {
    return result
  } else {
    return ''
  }
}

let Setting = mongoose.model('Setting', SettingSchema)

export { Setting }
