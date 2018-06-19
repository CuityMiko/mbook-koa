import mongoose from 'mongoose'
import { User, Book } from './index'

const AttendanceSchema = new mongoose.Schema(
  {
    userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    keep_times: Number, // 连续签到次数
    records: Array,
    create_time: Date // 创建时间
  },
  { versionKey: false }
)

/**
 * 将字母id装换成mongodb的ObjectId对象的静态函数
 */
AttendanceSchema.statics.transId = async function(id) {
  return mongoose.Types.ObjectId(id)
}

let Attendance = mongoose.model('Attendance', AttendanceSchema)

export { Attendance }
