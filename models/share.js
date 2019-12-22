import mongoose from 'mongoose'
import shortid from 'shortid'

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

ShareSchema.index({ userid: 1, code: 1 })

/**
 * 将字母id装换成mongodb的ObjectId对象的静态函数
 */
ShareSchema.statics.transId = async function(id) {
  return mongoose.Types.ObjectId(id)
}

/**
 * 获取用户分享码
 */
ShareSchema.statics.getUserShareCode = async function(userid) {
  const thisShare = await Share.findOne({ userid })
  if (thisShare) {
    return thisShare.code
  } else {
    // 不存在则创建一个
    const newShare = await Share.create({
      userid: await Share.transId(userid),
      code: shortid.generate(),
      award_records: [],
      accept_records: [],
      create_time: new Date()
    })
    return newShare.code
  }
}

const Share = mongoose.model('Share', ShareSchema)

export { Share }
