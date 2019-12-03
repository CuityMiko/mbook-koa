import { speech as AipSpeechClient } from 'baidu-aip-sdk'
import { baiduAiAppId, baiduAiAppKey, baiduAiSecretKey } from '../config'
import fs from 'fs'

const MAX_TEXT_LENGTH = '100'

export default function(router) {
  /**
   * 前端接口
   * 将语文字转化成语音
   */
  router.post('/api/front/voice-trans', async ctx => {
    const { content = '', needSplit = false } = ctx.request.body
    if (!content) {
      ctx.body = { ok: false, msg: '请输入需要转化成语言的文字' }
      return
    }
    // 需要分段加载
    const client = new AipSpeechClient(baiduAiAppId, baiduAiAppKey, baiduAiSecretKey)
    if (needSplit) {

    } else {

    }
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
  })
}
