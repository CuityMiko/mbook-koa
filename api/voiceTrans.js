import voiceTransMp3 from '../utils/voiceTrans'
import { Chapter } from '../models'

export default function(router) {
  /**
   * 前端接口
   * 将语文字转化成语音
   */
  router.get('/api/front/voice-trans', async ctx => {
    const { chapter } = ctx.request.query
    if (!chapter) {
      ctx.body = { ok: false, msg: '请指定章节ID' }
      return
    }

    // 检查是否已经转化
    const thisChapter = await Chapter.findById(chapter, 'voices content')
    if (!thisChapter) {
      ctx.body = { ok: false, msg: '章节不存在' }
      return
    }
    if (thisChapter && thisChapter.voices && thisChapter.voices.length > 0) {
      // 已转化直接返回
      ctx.body = { ok: true, msg: '获取语音成功', data: thisChapter.voices }
    } else {
      // 未转化现场转化
      const content = thisChapter.content.replace(/[\n\t\s]+/, '')
      const voices = await voiceTransMp3({ content, split: true })
      if (voices && voices instanceof Array) {
        // 存储到数据库中
        await Chapter.update({ _id: thisChapter.id }, { $set: { voices } })
        ctx.body = { ok: true, msg: '获取语音成功', data: voices }
      } else {
        ctx.body = { ok: false, msg: '合成语音失败' }
      }
    }
  })
}
