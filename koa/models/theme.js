import mongoose from 'mongoose'
import { Book } from './index'

const ThemeSchema = new mongoose.Schema({
  priority: Number, // 显示优先级
  name: { type: String,  unique: true }, // 栏目名称
  des: String, // 栏目描述
  books: Array, // 包含的书籍id
  show: Boolean, // 是否展示,
  layout: Number, // 展示时的布局方式
  flush: Boolean,
  create_time: Date
}, { versionKey: false })

ThemeSchema.statics.add = async function (ctx, theme) {
  let document = await this.findOne({ name: theme.name })
  if (document) {
      return { ok: false, msg: '主题名称已经存在' }
  }
  let u = await theme.save()
  return { ok: true, msg: '添加成功', data: u.books }
}

let Theme = mongoose.model('Theme', ThemeSchema)

export { Theme }
