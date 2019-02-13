import mongoose from 'mongoose'

const DialogSchema = new mongoose.Schema(
  {
    type: { type: String, default: '' }, // 弹窗类型，fixed-btn(全局悬浮按钮)，index-dialog(首页弹窗), redpock(首页红包)
    data: { type: Object, default: {} },
    start_date: Date, // 弹窗生效时间
    end_date: Date, // 弹窗失效时间
    description: String, // 备注
    create_time: { type: Date, default: new Date() }
  },
  { versionKey: false }
)

/**
 * 将字母id装换成mongodb的ObjectId对象的静态函数
 */
DialogSchema.statics.transId = async function(id) {
  return mongoose.Types.ObjectId(id)
}

let Dialog = mongoose.model('Dialog', DialogSchema)

export { Dialog }
