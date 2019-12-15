import { DEBUG_MODE } from '../config'
import Redmine from 'node-redmine'
import jsonifyError from 'jsonify-error'

const redmine = new Redmine('http://118.24.94.40:8080', { apiKey: 'b9e6bfb5cad06de72d1f49162de83a69eae569ba' })

/**
 * 打印调试信息，方便错误跟踪
 * @param {*} names 调试信息说明
 * @param {*} value 调试信息主体
 */
const debug = (names, value) => {
  if (DEBUG_MODE) {
    if (names instanceof Array) {
      for (let i = 0; i < names; i++) {
        console.log(names[i].name + ': ' + names[i].value)
      }
    } else if (typeof names === 'string' && value) {
      console.log(names + ': ', value)
    }
  }
}

const transPriority = priority => {
  let id = 1
  switch (priority) {
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

const transCategory = category => {
  let id = 1
  switch (category) {
    case '服务器500':
      id = 1
      break
    case '打印日志':
      id = 2
      break
    case '错误':
      id = 3
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
      extra += `${i}: ${typeof newOptions.extra[i] === 'object' ? JSON.stringify(newOptions.extra[i]) : newOptions.extra[i]}\n`
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
      description: `${extra}*错误详情*: \n${JSON.stringify(jsonifyError(error || {}), null, 2)}`,
      priority_id: transPriority(newOptions.priority),
      category_id: transPriority(newOptions.category)
    }
  }

  redmine.create_issue(issue, function(err, data) {
    if (err) throw err;
    if (error) {
      console.log(error)
      console.log('已上传该错误')
    }
  });
}

export { debug, reportError }
