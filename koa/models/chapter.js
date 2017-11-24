import mongoose from 'mongoose'

const ChapterSchema = new mongoose.Schema({
    name: String, // 章节名
    num: Number, // 章节数
    content: String, // 内容
    create_time: Date // 创建时间
}, { versionKey: false })

let Chapter = mongoose.model('Chapter', ChapterSchema)

export { Chapter }
