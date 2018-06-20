import mongoose from 'mongoose'

const FormIdSchema = new mongoose.Schema(
  {
    userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    formid: { type: String },
    create_time: Date
  },
  { versionKey: false }
)

FormIdSchema.index({ userid: 1 }, { unique: true })
/**
 * 将字母id装换成mongodb的ObjectId对象的静态函数
 */
FormIdSchema.statics.transId = async function(id) {
  return mongoose.Types.ObjectId(id)
}

let FormId = mongoose.model('FormId', FormIdSchema)

export { FormId }
