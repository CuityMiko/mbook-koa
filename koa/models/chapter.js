import mongoose from 'mongoose'

const ChapterSchema = new mongoose.Schema({
    name: String, // 书名
    num: Number, // 封面图片地址
    content: String, // 作者
    create_time: Date // 创建时间
}, { versionKey: false })

let Chapter = mongoose.model('Chapter', ChapterSchema)

export { Chapter }
