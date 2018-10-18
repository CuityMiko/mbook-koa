import mongoose from 'mongoose'

const FriendHelpBookSchema = new mongoose.Schema(
  {
    bookid: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
    need_num: Number, // 需要好友助力数量
    limit_time: Number, // 限定完成时间
    index: Number, // 排序
    create_time: Date
  },
  { versionKey: false }
)

/**
 * 将字母id装换成mongodb的ObjectId对象的静态函数
 */
FriendHelpBookSchema.statics.transId = async function(id) {
  return mongoose.Types.ObjectId(id)
}

let FriendHelpBook = mongoose.model('FriendHelpBook', FriendHelpBookSchema)

export { FriendHelpBook }
