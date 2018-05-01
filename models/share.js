import mongoose from 'mongoose'

const ShareSchema = new mongoose.Schema({
    launch_uid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    source: String, // 0: 个人，1: 群分享
    accept_records: [
      {
      	uid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      	accept_time: Date
      }
    ],
    create_time: Date // 创建时间
}, { versionKey: false })

/**
 * 将字母id装换成mongodb的ObjectId对象的静态函数
 */
ShareSchema.statics.transId = async function (id) {
  return mongoose.Types.ObjectId(id)
}

let Share = mongoose.model('Share', ShareSchema)

export { Share }