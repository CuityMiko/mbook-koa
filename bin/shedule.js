// 每周定时清除用户阅读时长
import schedule from 'node-schedule'
import { User } from '../models'

async function run() {
  const clearReadTime = schedule.scheduleJob('0 0 0 * * 7', async function() {
    const updateResult = await User.update({}, { $set: { read_time: 0 } }, { multi: true })
    if (updateResult.ok === 1) {
      console.log('重置阅读时长成功')
    } else {
      console.error('重置阅读时长失败，请手动重置')
    }
  })
}

module.exports = {
  run: run
}
