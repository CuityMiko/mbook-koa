import { speech as AipSpeechClient } from 'baidu-aip-sdk'
import { baiduAiAppId, baiduAiAppKey, baiduAiSecretKey } from '../config'
import fs from 'fs'

const MAX_TEXT_LENGTH = '100'

export default async function voiceTransMp3(data = {}) {
  const result = []
  const { content = '', split = true } = data
  const client = new AipSpeechClient(baiduAiAppId, baiduAiAppKey, baiduAiSecretKey)

  if (!content) return result
  if (split) {
  } else {
    client.text2audio('百度语音合成测试').then(
      function(result) {
        if (result.data) {
          fs.writeFileSync('tts.mpVoice.mp3', result.data)
        } else {
          // 服务发生错误
          console.log(result)
        }
      },
      function(e) {
        // 发生网络错误
        console.log(e)
      }
    )
  }
}
