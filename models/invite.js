import mongoose from 'mongoose'

const ShareSchema = new mongoose.Schema(
  {
    userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    code: String, // 裂变邀请码
    accept_records: [
      {
        name: String, // 接受人名称
        avatar: String, // 接受人头像
        accept_time: Date
      }
    ],
    success: Boolean, // 是否成功发奖
    create_time: Date // 创建时间
  },
  { versionKey: false }
)

/**
 * 将字母id装换成mongodb的ObjectId对象的静态函数
 */
ShareSchema.statics.transId = async function(id) {
  return mongoose.Types.ObjectId(id)
}

let Share = mongoose.model('Share', ShareSchema)

export { Share }
