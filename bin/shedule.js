// 每周定时清除用户阅读时长
import schedule from 'node-schedule'
import { exec } from 'child_process'
import { User } from '../models'
import path from 'path'
import moment from 'moment'

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
      console.log('开始执行书城更新...\n当前时间: ' + moment().format('YYYY-MM-DD hh:mm:ss'))
      exec(`npx runkoa ${path.join(process.cwd(), './spider/update.js')}`)
    })
  } catch (err) {
    console.log(err)
  }
}

console.log('开始执行书城更新...\n当前时间: ' + moment().format('YYYY-MM-DD hh:mm:ss'))
exec(`npx runkoa ${path.join(process.cwd(), './spider/update.js')}`)

module.exports = {
  run: run
}
