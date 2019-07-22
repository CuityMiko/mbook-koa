import mongoose from 'mongoose'

const NoticeSchema = new mongoose.Schema(
  {
    user: String, // 用户ID，如果为all则通知到全部用户
    type: String, // 通知类型，system: 系统通知，update: 更新通知
    title: String,
    description: String,
    content: String, // 消息内容
    preview: String, // 缩略内容
    bookid: String, // 更新通知的书籍id
    create_time: Date // 创建时间
  },
  { versionKey: false }
)

NoticeSchema.index({ user: 1 })

/**
 * 将字母id装换成mongodb的ObjectId对象的静态函数
 */
NoticeSchema.statics.transId = async function(id) {
  return mongoose.Types.ObjectId(id)
}

let Notice = mongoose.model('Notice', NoticeSchema)

export { Notice }
