import mongoose from 'mongoose'

const AppUserSchema = new mongoose.Schema({
  username: { type: String,  unique: true },
  password: String,
  avatar: String,
  create_time: Date
}, { versionKey: false })

let AppUser = mongoose.model('AppUser', AppUserSchema)

export { AppUser }
