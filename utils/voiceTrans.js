import { speech as AipSpeechClient } from 'baidu-aip-sdk'
import { BAIDU_AI_APP_ID, BAIDU_AI_SECRET_KEY, BAIDU_AI_APP_KEY } from '../config'
import qiniuUpload from '../utils/qiniuUpload'
import uuid from 'uuid'
import Queue from 'p-queue'

const MAX_TEXT_LENGTH = 200

export default async function voiceTransMp3(data = {}) {
  const result = []
  const { content = '', split = false } = data
  const client = new AipSpeechClient(BAIDU_AI_APP_ID, BAIDU_AI_APP_KEY, BAIDU_AI_SECRET_KEY)

  if (!content) return result

  if (split) {
    return new Promise((tresolve, treject) => {
      try {
        const paramNum = Math.ceil(content.length / MAX_TEXT_LENGTH)
        const queue = new Queue({ concurrency: 3, autoStart: false })
        const transPromiseArr = []
        for (let i = 0; i < paramNum; i++) {
          const endPoint = content.length > MAX_TEXT_LENGTH * (i + 1) ? MAX_TEXT_LENGTH * (i + 1) : content.length
          const subContent = content.substring(MAX_TEXT_LENGTH * i, endPoint)
          queue.add(() => {
            return new Promise((resolve, reject) => {
              client.text2audio(subContent).then(
                function(result) {
                  if (!result || !result.data) reject(new Error('百度语音合成失败'))
                  // 七牛上传
                  qiniuUpload(result.data, 'mbook/voice/' + uuid.v1() + '.mp3')
                    .then(res => {
                      transPromiseArr.push({ key: i, url: res })
                      resolve(res)
                    })
                    .catch(err => {
                      throw err
                    })
                },
                function(err) {
                  throw err
                }
              )
            })
          })
        }

        queue.start()
        queue.onIdle().then(() => {
          tresolve(
            transPromiseArr
              .sort((arr1, arr2) => {
                return arr1.key - arr2.key
              })
              .map(item => item.url)
          )
        })
      } catch (err) {
        console.log('百度语音合成失败', err)
        treject(err)
      }
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
