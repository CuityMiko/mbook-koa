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
  var res=[];
  for(var i=0,len=arr.length;i<len;i++){
      var obj = arr[i];
      for(var j=0,jlen = res.length;j<jlen;j++){
          if(res[j]===obj) break;            
      }
      if(jlen===j)res.push(obj);
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

module.exports = {
  formatTime: formatTime,
  formatTime2: formatTime2,
  unique: unique,
  md5: md5,
  xmlToJson: xmlToJson,
  jsonToXml: jsonToXml
}
