import Promise from 'bluebird'
import crypto from 'crypto'
import xml2js from 'xml2js'
import bcrypt from 'bcrypt'
import pathToRegexp from 'path-to-regexp'

/**
 * 格式化true和false
 * @param {*} n 
 */
const formatBoolean = value => {
  return value ? 1 : 0;
}

/**
 * 格式化日期，转变成'2017/11/19 00:00:00'
 */
const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatTime2 = date => {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()

  return [month, day].map(formatNumber).join('-') + ' ' + [hour, minute].map(formatNumber).join(':')
}

const unique = arr => {
  let res = []
  for (let i = 0, len = arr.length; i < len; i++) {
    let obj = arr[i]
    let jlen = res.length
    let j = 0
    for (j = 0; j < jlen; j++) {
      if (res[j] === obj) break
    }
    if (jlen === j) res.push(obj)
  }
  return res
}

/**
 * 生成md5值
 * @param {String} str
 */
const md5 = str => {
  return crypto
    .createHash('md5')
    .update(str)
    .digest('hex')
}

/**
 * koa处理xml的函数, 将xml转化成json
 * @param {String} str
 */
const xmlToJson = str => {
  return new Promise((resolve, reject) => {
    const parseString = xml2js.parseString
    parseString(str, (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

/**
 * koa处理xml的函数, 将json转化成xml
 * @param {Object} obj
 */
const jsonToXml = obj => {
  const builder = new xml2js.Builder()
  return builder.buildObject(obj)
}

/**
 * 模拟thinkjs判断对象是否为空
 * @param {Object} obj
 */
const isEmpty = obj => {
  if (!obj) {
    return true
  } else {
    if (typeof obj === 'object' && JSON.stringify(obj) === '{}') {
      return true
    }
    if (obj instanceof Array && obj.length === 0) {
      return true
    }
    return false
  }
}

/**
 * 计算一组日期中连续天数的次数
 * @param {Array} arr
 */
const continueDays = arr => {
  let date = new Date()
  let y = date.getFullYear()
  let m = date.getMonth() + 1
  let d = date.getDate()
  let today = y + '/' + m + '/' + d
  //转时间戳
  function time(date) {
    return new Date(date)
  }
  // arr检测
  arr = arr.filter(item => {
    return time(item) < time(today)
  })
  let num = 0 //声明计数变量;
  let le = arr.length //数组长度;
  //日期时间戳相差一天则连续,此法虽笨,但实用;判断当前日期与最近一天
  if (time(today) - time(arr[le - 1]) == 86400000) {
    num = 2 //满足条件,连续2天;
    //然后对数组循环判断,满足则num++;否则中断循环;
    for (let i = le; i > 0; i--) {
      if (time(arr[i - 1]) - time(arr[i - 2]) == 86400000) {
        num++
      } else {
        break //如果只要找出所有连续的天数,不需要中断
      }
    }
    return num
  } else {
    return 1
  }
}

/**
 * 格式化中文章节为章节数
 * @param {String} str
 * @example chineseParseInt('一百') ==> 100
 */
const chineseParseInt = (function() {
  var chars = {
    '０': 0,
    零: 0,
    '○': 0,
    〇: 0,
    洞: 0,
    '１': 1,
    一: 1,
    壹: 1,
    ㄧ: 1,
    弌: 1,
    么: 1,
    '２': 2,
    二: 2,
    貳: 2,
    贰: 2,
    弍: 2,
    兩: 2,
    两: 2,
    '３': 3,
    三: 3,
    參: 3,
    叁: 3,
    弎: 3,
    参: 3,
    叄: 3,
    '４': 4,
    四: 4,
    肆: 4,
    䦉: 4,
    刀: 4,
    '５': 5,
    五: 5,
    伍: 5,
    '６': 6,
    六: 6,
    陸: 6,
    陆: 6,
    '７': 7,
    七: 7,
    柒: 7,
    拐: 7,
    '８': 8,
    八: 8,
    捌: 8,
    杯: 8,
    '９': 9,
    九: 9,
    玖: 9,
    勾: 9,
    十: 10,
    拾: 10,
    什: 10,
    呀: 10,
    百: 100,
    佰: 100,
    千: 1000,
    仟: 1000,
    念: 20,
    廿: 20,
    卅: 30,
    卌: 40,
    皕: 200,
    萬: 1e4,
    万: 1e4,
    億: 1e8,
    亿: 1e8,
    兆: 1e12,
    京: 1e16,
    經: 1e16,
    经: 1e16,
    垓: 1e20,
    秭: 1e24,
    杼: 1e24,
    穰: 1e28,
    壤: 1e28,
    溝: 1e32,
    沟: 1e32,
    澗: 1e36,
    涧: 1e36,
    正: 1e40,
    載: 1e44,
    極: 1e48
  }

  var main = function(str, radix) {
    // 格式化掉不必要的文字
    str = str.replace(/[^零一二三四五六七八九十百千万0-9]/g, '')
    var result = parseInt(str, radix)
    if (!isNaN(result)) return result
    if (typeof str !== 'string') return NaN

    str = str.replace(/[\s　]+/g, '')
    var negative = /^[負负-]/.test(str)
    if (negative) str = str.substr(1)

    result = 0
    var partialSum = 0 ///< 不到一萬的部分
    var digit = -1 ///< 個位數，預設為 -1 以區分有無"零"的出現

    for (var i = 0; i < str.length; ++i) {
      var charVal = chars[str.charAt(i)] ///< 暫存字元代表的數值
      if (charVal === undefined) return NaN // 有任何不認得的字，直接 NaN
      if (charVal < 10) {
        digit = digit == -1 ? charVal : digit * 10 + charVal // ex. 零五、二五六萬
      } else if (charVal < 1e4) {
        if (digit == -1) digit = 1
        if (i > 1 && digit == 0 && chars[str.charAt(i - 2)] != 100) digit = 1 // 處理"一千零十一"；搜尋"千零十"的確是出現過的。
        partialSum += digit * charVal
        digit = -1
      } else {
        if (digit != -1) partialSum += digit
        if (i && chars[str.charAt(i - 1)] >= 1e4)
          // 為了"四萬萬五千萬"
          result *= chars[str.charAt(i)]
        else result += partialSum * charVal
        partialSum = 0
        digit = -1
      }
    }
    if (digit > 0) {
      if (str.length > 1) {
        // 為了處理"二十四萬二"、"二百五"等
        charVal = chars[str.charAt(str.length - 2)]
        if (charVal < 100) partialSum += digit
        else {
          charVal /= charVal.toString().charAt(0) // 把「皕」轉成100
          partialSum += digit * (charVal / 10)
        }
      } else partialSum += digit
    }
    result += partialSum

    if (negative) result *= -1
    return result
  }

  main.characters = chars
  return main
})()

/**
 * 验证字符串是否是一个json字符串
 * @param {String} str
 * @returns {Boolean} true或者false
 */
const isJsonString = str => {
  try {
    str = JSON.parse(str)
    return true
  } catch (err) {
    console.log(err)
    return false
  }
}

const formatDuring = function(mss) {
  let days = parseInt((mss % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60 * 24))
  let hours = parseInt((mss % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  let minutes = parseInt((mss % (1000 * 60 * 60)) / (1000 * 60))
  let seconds = (mss % (1000 * 60)) / 1000
  days = days < 0 ? '0' : days
  days = days < 10 ? '0' + days : days
  hours = hours < 0 ? '0' : hours
  hours = hours < 10 ? '0' + hours : hours
  minutes = minutes < 0 ? '0' : minutes
  minutes = minutes < 10 ? '0' + minutes : minutes
  seconds = seconds < 0 ? '0' : seconds
  seconds = seconds < 10 && seconds >= 1 ? '0' + seconds : seconds
  console.log(days, hours, minutes)
  return days + '天 ' + hours + '小时 ' + minutes + '分'
}

/**
 * 加密密码
 * @param {String} password 密码
 */
export async function generatePasswordHash(password) {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

/**
 * 路径匹配
 * @param {String} rulePath 路径规则
 * @param {String} currentPath 当前路径
 * @returns {Boolean} true或者false
 */
export function pathMatch(rulePath, currentPath) {
  const ruleMethod = rulePath.split(' ')[0] || ''
  const rulePathStr = rulePath.split(' ')[1] || ''
  const currentMethod = currentPath.split(' ')[0] || ''
  const currentPathStr = currentPath.split(' ')[1] || ''
  return ruleMethod.toLowerCase() === currentMethod.toLowerCase() && !!pathToRegexp(rulePathStr).exec(currentPathStr)
}


module.exports = {
  formatBoolean,
  formatTime,
  formatTime2,
  unique,
  md5,
  xmlToJson,
  jsonToXml,
  isEmpty,
  continueDays,
  formatDuring,
  chineseParseInt,
  isJsonString,
  pathMatch
}
