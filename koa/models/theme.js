import mongoose from 'mongoose'
import { Book } from './index'

const ThemeSchema = new mongoose.Schema({
  priority: Number, // 显示优先级
  name: { type: String,  unique: true }, // 栏目名称
  des: String, // 栏目描述
  books: [{
    bookid: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
    index: Number
  }], // 所有书籍
  show: Boolean, // 是否展示,
  layout: Number, // 展示时的布局方式
  flush: Boolean,
  create_time: Date
}, { versionKey: false })

ThemeSchema.statics.transId = async function (id) {
  return mongoose.Types.ObjectId(id)
}

let Theme = mongoose.model('Theme', ThemeSchema)

export { Theme }
