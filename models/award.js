import mongoose from 'mongoose'

const AwardSchema = new mongoose.Schema(
  {
    userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    des: String,
    create_time: Date
  },
  { versionKey: false }
)

/**
 * 将字母id装换成mongodb的ObjectId对象的静态函数
 */
AwardSchema.statics.transId = async function(id) {
  return mongoose.Types.ObjectId(id)
}

let Award = mongoose.model('Award', AwardSchema)

export { Award }
