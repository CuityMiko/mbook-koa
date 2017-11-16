import mongoose from 'mongoose'

const AdminUserSchema = new mongoose.Schema({
  username: { type: String,  unique: true },
  password: String,
  avatar: String,
  createTime: Date
}, { versionKey: false })

let AdminUser = mongoose.model('AdminUser', AdminUserSchema)

export { AdminUser }
