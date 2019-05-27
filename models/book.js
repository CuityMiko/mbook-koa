import mongoose from 'mongoose'
import { Chapter } from './index'

const BookSchema = new mongoose.Schema(
  {
    name: String, // 书名
    img_url: String, // 封面图片地址
    author: String, // 作者
    des: String, // 书籍描述
    classification: String, // 所属分类
    classify_order: Number, // 所属分类的排序值
    update_status: String, // 更新状态--连载中或者完结
    newest_chapter: Number, // 最新章节
    total_words: String, // 总字数
    hot_value: Number, // 热度值
    update_time: Date, // 更新时间
    secret: { type: String, unique: true }, // 书籍秘钥
    create_time: Date, // 创建时间
    source: [{ type: String }], // 书籍来源
  },
  { versionKey: false }
)

/**
 * 更改书籍更新时间
 */
BookSchema.statics.updateTime = function(id) {
  if (!id) {
    return false
  }
  this.findById(id, async (merr, mres) => {
    if (merr) {
      console.log('更改书籍更新时间失败，找不到此书籍', merr)
      return false
    }
    const newestChapter = await Chapter.findOne({ bookid: id }, 'num').sort({ num: -1 }).limit(1)
    if (newestChapter && newestChapter.num) {
      const updateResult = await this.update({ _id: id }, {
        $set: {
          newest_chapter: newestChapter.num,
          update_time: new Date()
        }
      })
      if (updateResult.ok === 1) {
        return true
      } else {
        console.log('更改书籍更新时间失败', updateResult)
        return false
      }
    } else {
      console.log('更改书籍更新时间失败', newestChapter)
      return false
    }
  })
  
}

let Book = mongoose.model('Book', BookSchema)

export { Book }
