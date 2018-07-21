import mongoose from 'mongoose'

const ShareSchema = new mongoose.Schema(
  {
    userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    code: String, // 邀请码
    award_records: [
      {
        name: String, // 奖励名称
        user: String,
        amount: Number, // 奖励数量
        award_time: Date
      }
    ],
    share_records: [
      {
        wx_share_id: String,
        share_time: Date // 分享时间
      }
    ], // 分享记录
    accept_records: [
      {
        uid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // 别人接受我的记录
        accept_time: Date
      }
    ],
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
