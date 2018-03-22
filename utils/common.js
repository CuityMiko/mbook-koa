import Promise from 'bluebird'
import crypto from 'crypto'
import xml2js from 'xml2js'

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
  let res = [];
  for (let i = 0, len = arr.length; i < len; i++) {
    let obj = arr[i];
    let jlen = res.length;
    let j = 0;
    for (j = 0; j < jlen; j++) {
      if (res[j] === obj) break;
    }
    if (jlen === j) res.push(obj);
  }
  return res;
}

/**
 * 生成md5值
 * @param {String} str 
 */
const md5 = str => {
  return crypto.createHash('md5').update(str).digest('hex')
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
    if (typeof (obj) === 'object' && JSON.stringify(obj) === '{}') {
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
  let date = new Date();
  let y = date.getFullYear();
  let m = date.getMonth() + 1;
  let d = date.getDate();
  let today = y + '/' + m + '/' + d;
  //转时间戳
  function time(date) {
    return new Date(date);
  }
  // arr检测
  arr = arr.filter(item => {
    return time(item) < time(today)
  })
  let num = 0;//声明计数变量;
  let le = arr.length;//数组长度;
  //日期时间戳相差一天则连续,此法虽笨,但实用;判断当前日期与最近一天
  if (time(today) - time(arr[le - 1]) == 86400000) {
    num = 2;//满足条件,连续2天;
    //然后对数组循环判断,满足则num++;否则中断循环;
    for (let i = le; i > 0; i--) {
      if (time(arr[i - 1]) - time(arr[i - 2]) == 86400000) {
        num++;
      } else {
        break;//如果只要找出所有连续的天数,不需要中断
      }
    }
    return num
  } else {
    return 1
  }
}

module.exports = {
  formatTime: formatTime,
  formatTime2: formatTime2,
  unique: unique,
  md5: md5,
  xmlToJson: xmlToJson,
  jsonToXml: jsonToXml,
  isEmpty: isEmpty,
  continueDays: continueDays
}
