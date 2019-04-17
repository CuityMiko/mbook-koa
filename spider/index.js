/**
 * 爬虫入口函数
 */
import log4js from 'log4js'

log4js.configure({
  appenders: {
    console: { type: 'console' },
    updateBook: {
      type: 'file',
      filename: path.join(__dirname, '../logs/updateBook.log')
    }
  },
  categories: {
    default: { appenders: ['console'], level: 'DEBUG' },
    updateBook: { appenders: ['updateBook'], level: 'DEBUG'}
  }
})




