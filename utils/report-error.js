import config from '../config'
import Redmine from 'node-redmine'
import jsonifyError from 'jsonify-error'

const redmine = new Redmine('http://118.24.94.40:8080', { apiKey: 'a07af0747a169cb81ee4589f23fc3e9f1cca1b2d' })

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

const transProperty = property => {
  let id = 1
  switch (property) {
    case '低':
      id = 1
      break
    case '普通':
      id = 2
      break
    case '高':
      id = 3
      break
    case '紧急':
      id = 4
      break
    case '立刻':
      id = 5
      break
    default:
      break
  }
  return id
}

const reportError = (title, error, options) => {
  let newOptions = {}
  if (typeof options === 'object') {
    newOptions = Object.assign(newOptions, options)
  }
  let extra = ''
  if (typeof newOptions.extra === 'object') {
    // 上传错误日志
    extra += `*调试信息*:\n`
    for (let i in newOptions.extra) {
      extra += `${i}: ${newOptions.extra[i]}\n`
    }
    extra += '\n'
  }
  /*
   * create issue
   */
  const issue = {
    issue: {
      project_id: 1,
      subject: title || error.toString(),
      description: `${extra}*错误详情*: \n${JSON.stringify(jsonifyError(error), null, 2)}`,
      priority_id: transProperty(newOptions.priority)
    }
  }

  redmine.create_issue(issue, function(err, data) {
    if (err) throw err;
    console.log(error)
    console.log('已上传该错误')
  });
}

export { debug, reportError }
