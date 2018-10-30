const Sentry = require('@sentry/node')
const config = require('../config')
// 安装日志上传工具
Sentry.init({ dsn: 'https://b16f63d122694fa3b607a81c285fb900@sentry.io/1310873' })

/**
 * 打印调试信息，方便错误跟踪
 * @param {*} names 调试信息说明
 * @param {*} value 调试信息主体
 */
const debug = (names, value) => {
  if (config.debug) {
    if (names instanceof Array) {
      for (let i = 0; i < names; i++) {
        console.log(names[i].name + ': ' + names[i].value)
      }
    } else if (typeof names === 'string' && value) {
      console.log(names + ': ', value)
    }
  }
}

const reportError = (error, options) => {
  if (!error) {
    return false
  }
  let newOptions = {}
  if (typeof options === 'object') {
    newOptions = Object.assign(newOptions, options)
  }
  if (typeof newOptions.extra === 'object') {
    // 上传错误日志
    Sentry.configureScope(scope => {
      for (let i in newOptions.extra) {
        scope.setExtra(i, newOptions.extra[i])
      }
    })
  }
  Sentry.captureException(error)
}

export { debug, reportError }
