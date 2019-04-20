// 每周定时清除用户阅读时长
import schedule from 'node-schedule'
import { User } from '../models'
import { updateBook } from '../spider/update'

async function run() {
  try {
    // 每星期天清除阅读时间
    schedule.scheduleJob('0 0 0 * * 7', async () => {
      const updateResult = await User.update({}, { $set: { read_time: 0 } }, { multi: true })
      if (updateResult.ok === 1) {
        console.log('重置阅读时长成功')
      } else {
        console.error('重置阅读时长失败，请手动重置')
      }
    })
    // 每天凌晨执行书籍更新
    schedule.scheduleJob('0 0 3 * * *', async () => {
      await updateBook()
    })
  } catch (err) {
    console.log(err)
  }
}

// (async function() {
//   await updateBook()
// })()

module.exports = {
  run: run
}
