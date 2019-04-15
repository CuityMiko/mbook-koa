// 每周定时清除用户阅读时长
import schedule from 'node-schedule'
import { User } from '../models'
import { getProxyIpAddress } from '../spider/proxy'
import { updateBook } from '../spider/update'

async function run() {
  // 每星期天清除阅读时间
  schedule.scheduleJob('0 0 0 * * 7', async function() {
    const updateResult = await User.update({}, { $set: { read_time: 0 } }, { multi: true })
    if (updateResult.ok === 1) {
      console.log('重置阅读时长成功')
    } else {
      console.error('重置阅读时长失败，请手动重置')
    }
  })
  // 每隔10分钟刷新redis中的代理ip地址
  schedule.scheduleJob('*/10 * * * *', getProxyIpAddress)
  // 每天凌晨执行更新
  schedule.scheduleJob('0 0 11 * * *', async function() {
    await updateBook()
  })
}

module.exports = {
  run: run
}