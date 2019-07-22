import mongoose from 'mongoose'

const FriendHelpSchema = new mongoose.Schema(
  {
    userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fhbid: { type: mongoose.Schema.Types.ObjectId, ref: 'FriendHelpBook' },
    fhcode: String, // 裂变邀请码
    records: [
      {
        uid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String, // 接受人名称
        avatar: String, // 接受人头像
        time: Date
      }
    ],
    success: Boolean, // 是否成功发奖
    source: String, // 来源统计，banner首页广告，book_detail书籍详情页，reader阅读页
    create_time: Date // 创建时间
  },
  { versionKey: false }
)

FriendHelpSchema.index({ userid: 1, fhbid: 1, fhcode: 1 })

/**
 * 将字母id装换成mongodb的ObjectId对象的静态函数
 */
FriendHelpSchema.statics.transId = async function(id) {
  return mongoose.Types.ObjectId(id)
}

let FriendHelp = mongoose.model('FriendHelp', FriendHelpSchema)

export { FriendHelp }
