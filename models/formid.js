import mongoose from 'mongoose'

const FormIdSchema = new mongoose.Schema(
  {
    userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    records: [
      {
        type: { type: String, default: '' },
        bookid: { type: Object, default: '' },
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
FormIdSchema.statics.getFormId = async function(type, userId, bookId) {
  if (!type) {
    return ''
  }
  if (!userId) {
    return ''
  }
  let thisForm = await this.findOne({ userid: userId })
  if (!thisForm) {
    return ''
  }
  if (thisForm.records instanceof Array && thisForm.records.length >= 1) {
    let tmpId = ''
    if (type === 'read' && bookId) {
      for (let i = 0; i < thisForm.records.length; i++) {
        // 7天内未被使用
        let isRead = thisForm.records[i].type === 'read'
        let isThisBook = thisForm.records[i].bookid.toString() === bookId
        let inSevenDays = thisForm.records[i].add_time.getTime() >= Date.now() - 604800000
        if (isRead && isThisBook && inSevenDays) {
          tmpId = thisForm.records[i].value
          break
        }
      }
    } else {
      // bookid不存在，取时间最早的formId
      let records = thisForm.records.filter(item => {
        return item.type !== 'read'
      })
      records.sort((item1, item2) => {
        return item1.add_time.getTime() - item2.add_time.getTime()
      })
      return records[0] ? records[0].value : ''
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
    console.log('更新formId失败, userId不存在', { userId })
    return false
  }
  if (!formId) {
    console.log('更新formId失败, formId不存在', { formId })
    return false
  }
  let thisForm = await this.findOne({ userid: userId })
  if (!thisForm) {
    console.log('更新formId失败，找不到记录', { userId, formId })
    return false
  }
  let updateResult = await this.update({ userid: userId }, { $pull: { records: { value: formId } } })
  if (updateResult.ok == 1 && updateResult.nModified == 1) {
    return true
  } else {
    console.log('更新formId失败，更新失败', { userId, formId, updateResult })
    return false
  }
}

let FormId = mongoose.model('FormId', FormIdSchema)

export { FormId }
