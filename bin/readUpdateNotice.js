/**
 * 用途: 给关注书籍的用户发送书籍更新模板消息
 * 创建时间: 2018/11/18 10:53
 * 创建人: 李迪康(andyliwr@outlook.com)
 */
import Queue from 'p-queue'
import moment from 'moment'
import { Book, Chapter, BookList, User, Setting } from '../models'

/**
 * 发送书籍更新提示
 * @param {*} bookId 书籍id
 * @param {*} chapterId 章节id
 * @param {*} later 是否延迟发送
 * @returns null
 */
async function readUpdateNotice(bookId, chapterId, later) {
  // 判断设置中是否打开了书籍更新提示
  let setting = await Setting.findOne({ key: 'template_message_setting' }, 'value')
  if (!setting || !setting.value || JSON.parse(setting.value)['book-update'] !== 'true') {
    console.log('暂未打开书籍更新消息提示的设置')
    return false
  }
  if (!bookId) {
    console.log(`发送阅读更新通知失败，书籍${bookId}不存在`)
    return false
  }
  if (!chapterId) {
    console.log(`发送阅读更新通知失败，章节${chapterId}不存在`)
    return false
  }
  // 查找书籍信息
  let thisBook = await Book.findById(bookId, 'name author')
  if (!thisBook) {
    console.log(`发送阅读更新通知失败，书籍${bookId}不存在`)
    return false
  }
  // 查找章节信息
  let thisChapter = await Chapter.findById(chapterId, 'name num create_time')
  if (!thisChapter) {
    console.log(`发送阅读更新通知失败，章节${chapterId}不存在`)
    return false
  }
  // 查找所有收藏本书籍的用户, 最近7天有阅读记录的
  let now = Date.now()
  let noticeUsers = await BookList.find({ 'books.bookid': bookId, 'books.time': { $gte: now - 7 * 24 * 60 * 60 * 1000, $lte: now }, 'books.rss': 1 }, 'userid')
  let queue = new Queue({ concurrency: 10, autoStart: false })
  noticeUsers.forEach(async item => {
    queue.add(() =>
      User.sendMessage(
        item.userid,
        'book-update',
        {
          keyword1: { value: thisBook.name },
          keyword2: { value: moment(thisChapter.create_time).format('YYYY年MM月DD日 HH:mm:ss') },
          keyword3: { value: `更新章节：第${thisChapter.num}章 ${thisChapter.name}\n点击消息立即阅读吧~` }
        },
        { bookid: bookId }
      )
    )
  })
  // 队列添加完毕，开始批量执行
  queue.start()
  // 监听队列执行完毕
  queue.onIdle().then(res => {
    console.log(`队列执行完毕，通知用户数 ${noticeUsers.length}，书籍名 ${thisBook.name}，章节数 ${thisChapter.num}，章节名 ${thisChapter.name}`)
  })
}

module.exports = {
  readUpdateNotice: readUpdateNotice
}
