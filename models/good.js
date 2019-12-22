import mongoose from 'mongoose'
import { formatTime } from '../utils'

const GoodSchema = new mongoose.Schema(
  {
    bookid: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
    type: Number, // mode=1书本按照章节计算，mode=2书本限时免费， mode=3书本限章节免费
    prise: Number,
    limit_start_time: Date,
    limit_end_time: Date,
    limit_chapter: Number,
    create_time: Date
  },
  { versionKey: false }
)

GoodSchema.index({ bookid: 1 })

/**
 * 将字母id装换成mongodb的ObjectId对象的静态函数
 */
GoodSchema.statics.transId = async function(id) {
  return mongoose.Types.ObjectId(id)
}

/**
 * 获取商品格式化信息
 */
GoodSchema.statics.getFormatInfo = async function(id) {
  let good = {}
  const thisGood = await Good.findOne({ bookid: id })
  if (thisGood) {
    if (thisGood.type === 4) {
      // 免费商品
      good.type = 'free'
    } else if (thisGood.type === 2) {
      // 限时免费商品
      good.type = 'limit_date'
      good.limit_start_time = formatTime(thisGood.limit_start_time)
      good.limit_end_time = formatTime(thisGood.limit_end_time)
      good.prise = thisGood.prise
    } else if (thisGood.type === 3) {
      // 限制章节免费
      good.type = 'limit_chapter'
      good.limit_chapter = thisGood.limit_chapter
      good.prise = thisGood.prise
    } else if (thisGood.type === 1) {
      // 正常书籍，每章节收费
      good.type = 'normal'
      good.prise = thisGood.prise
    } else {
      good.type = 'free'
    }
  } else {
    // 非商品默认免费
    good.type = 'free'
  }

  return good
}

let Good = mongoose.model('Good', GoodSchema)

export { Good }
