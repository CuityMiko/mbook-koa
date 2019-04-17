import path from 'path'
/**
 * 爬虫日志配置函数
 */
import log4js from 'log4js'

log4js.configure({
  appenders: {
    console: { type: 'console' },
    spider: {
      type: 'file',
      filename: path.join(__dirname, '../logs/spider.log')
    }
  },
  categories: {
    default: { appenders: ['console'], level: 'DEBUG' },
    spider: { appenders: ['spider', 'console'], level: 'DEBUG' }
  }
})

const logger = log4js.getLogger('spider')

export { logger }