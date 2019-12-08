import { speech as AipSpeechClient } from 'baidu-aip-sdk'
import { baiduAiAppId, baiduAiAppKey, baiduAiSecretKey } from '../config'
import qiniuUpload from '../utils/qiniuUpload'
import uuid from 'uuid'

const MAX_TEXT_LENGTH = 200

export default async function voiceTransMp3(data = {}) {
  const result = []
  const { content = '', split = false } = data
  const client = new AipSpeechClient(baiduAiAppId, baiduAiAppKey, baiduAiSecretKey)

  if (!content) return result

  if (split) {
    return new Promise((tresolve, treject) => {
      const transPromiseArr = []
      const paramNum = Math.ceil(content.length / MAX_TEXT_LENGTH)
      for (let i = 0; i < paramNum; i++) {
        const endPoint = content.length > MAX_TEXT_LENGTH * (i + 1) ? MAX_TEXT_LENGTH * (i + 1) : content.length
        const subContent = content.substring(MAX_TEXT_LENGTH * i, endPoint)
        transPromiseArr.push(
          new Promise((resolve, reject) => {
            client.text2audio(subContent).then(
              function(result) {
                if (!result || !result.data) reject(new Error('百度语音合成失败'))
                // 七牛上传
                qiniuUpload(result.data, 'mbook/share/' + uuid.v1() + '.mp3')
                  .then(res => {
                    resolve(res)
                  })
                  .catch(err => {
                    reject(new Error('七牛上传错误'))
                  })
              },
              function(e) {
                reject(new Error('百度语音合成出现网络错误'))
              }
            )
          })
        )
      }

      Promise.all(transPromiseArr)
        .then(res => {
          tresolve(res)
        })
        .catch(err => {
          treject(new Error('百度多段语音合成出现错误'))
        })
    })
  } else {
    return new Promise((resolve, reject) => {
      client.text2audio(content).then(
        function(result) {
          if (!result || !result.data) reject(new Error('百度语音合成失败'))
          // 七牛上传
          qiniuUpload(result.data, 'mbook/share/' + uuid.v1() + '.mp3')
            .then(res => {
              resolve(res)
            })
            .catch(err => {
              reject(new Error('七牛上传错误'))
            })
        },
        function(e) {
          reject(new Error('百度语音合成出现网络错误'))
        }
      )
    })
  }
}
