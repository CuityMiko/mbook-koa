/**
 * 用途: 给关注书籍的用户发送书籍更新模板消息
 * 创建时间: 2018/11/18 10:53
 * 创建人: 李迪康(andyliwr@outlook.com)
 */
import Queue from 'p-queue'
import moment from 'moment'
import { reportError, debug } from '../utils'
import { Book, Chapter, BookList, User } from '../models'

/**
 * 发送书籍更新提示
 * @param {*} bookId 书籍id
 * @param {*} chapterId 章节id
 * @returns null
 */
async function readUpdateNotice(bookId, chapterId) {
  if (!bookId) {
    debug('发送阅读更新通知失败', '书籍id: ' + bookId + '不存在')
    return false
  }
  if (!chapterId) {
    debug('发送阅读更新通知失败', '章节id: ' + chapterId + '不存在')
    return false
  }
  // 查找书籍信息
  let thisBook = await Book.findById(bookId, 'name author')
  if (!thisBook) {
    debug('发送阅读更新通知失败', '找不到书籍id: ' + chapterId + '的书籍')
    return false
  }
  // 查找章节信息
  let thisChapter = await Chapter.findById(chapterId, 'name num create_time')
  if (!thisChapter) {
    debug('发送阅读更新通知失败', '找不到章节id: ' + chapterId + '的章节')
    return false
  }
  // 查找所有收藏本书籍的用户, 最近7天有阅读记录的
  let now = Date.now()
  let noticeUsers = await BookList.find({ 'books.bookid': bookId, 'books.time': { $gte: now - 7 * 24 * 60 * 60 * 1000, $lte: now } }, 'userid')
  console.log(noticeUsers)
  let queue = new Queue({ concurrency: 10, autoStart: false })
  queue.add(() => Promise.resolve('🐙')).then(console.log.bind(null, '11. Resolved'))
  noticeUsers.forEach(async item => {
    queue
      .add(async () =>
        User.sendMessage(
          item.userid,
          'book-update',
          {
            keyword1: { value: `《${thisBook.name}》` },
            keyword2: { value: '书籍更新提醒' },
            keyword3: { value: `更新章节：第${thisChapter.num}章 ${thisChapter.name}\n更新时间：${moment(thisChapter.create_time).format('YYYY年MM月DD日 HH:mm:ss')}\n点击消息立即阅读吧~` }
          },
          { bookid: bookId }
        )
      )
      .then(console.log(res, `用户${item.userid}发送书籍 ${thisBook.name} 更新提醒成功`))
      .catch(console.log(res, `用户${item.userid}发送书籍 ${thisBook.name} 更新提醒失败`))
  })
  // 队列添加完毕，开始批量执行
  queue.start()
  // 监听队列执行完毕
  queue.onIdle().then(() => {
    console.log('队列执行完毕')
  })
}

module.exports = {
  readUpdateNotice: readUpdateNotice
}
