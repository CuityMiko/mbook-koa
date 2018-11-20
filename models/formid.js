import mongoose from 'mongoose'
import book from '../api/book'

const FormIdSchema = new mongoose.Schema(
  {
    userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    records: [
      {
        bookid: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
        value: { type: String, default: '' },
        add_time: { type: Date, default: new Date() }
      }
    ],
    create_time: Date
  },
  { versionKey: false }
)

FormIdSchema.index({ userid: 1 }, { unique: true })

/**
 * 将字母id装换成mongodb的ObjectId对象的静态函数
 */
FormIdSchema.statics.transId = async function(id) {
  return mongoose.Types.ObjectId(id)
}

/**
 * 获取用户FormId
 */
FormIdSchema.statics.getFormId = async function(userId, bookId) {
  if (!userId) {
    return ''
  }
  let thisForm = await this.findOne({ userid: userId })
  if (!thisForm) {
    return ''
  }
  if (thisForm.records instanceof Array && thisForm.records.length > 1) {
    let tmpId = ''
    if (bookId) {
      for (let i = 0; i < thisForm.records.length; i++) {
        // 7天内未被使用
        let isThisBook = thisForm.records[i].bookid.toString() === bookId
        let inSevenDays = thisForm.records[i].add_time.getTime() >= Date.now() - 604800000
        if (isThisBook && inSevenDays) {
          tmpId = thisForm.records[i].value
          break
        }
      }
    } else {
      // bookid不存在，取时间最早的formId
      thisForm.records.sort((item1, item2) => {
        return item1.add_time.getTime() - item2.add_time.getTime()
      })
      return thisForm.records[0].value || ''
    }
    return tmpId
  } else {
    return ''
  }
}

/**
 * 更新用户FormId
 */
FormIdSchema.statics.updateFormId = async function(userId, formId) {
  if (!userId) {
    debug('更新formId失败, userId不存在', { userId })
    return false
  }
  if (!formId) {
    debug('更新formId失败, formId不存在', { formId })
    return false
  }
  let thisForm = await this.findOne({ userid: userId })
  if (!thisForm) {
    debug('更新formId失败，找不到记录', { userId, formId })
    return false
  }
  let updateResult = await this.update({ userid: userId }, { $pull: { records: { value: formId } } })
  if (updateResult.ok == 1 && updateResult.nModified == 1) {
    return true
  } else {
    debug('更新formId失败，更新失败', { userId, formId, updateResult })
    return false
  }
}

let FormId = mongoose.model('FormId', FormIdSchema)

export { FormId }
