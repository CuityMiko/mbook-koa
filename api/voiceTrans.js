import voiceTransMp3 from '../utils/voiceTrans';

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

    console.log(await voiceTransMp3({ content: '高智商腹黑女博士VS口嫌体直纨绔富少，狭路相逢扭，what？说好的甜蜜爱情呢？！春见眼中的白路舟：嘴巴坏，脾气糟，动不动就暴走，不讲道理，没文化。白路舟听了，怒。他嘴巴坏？就问问，那个好声好气哄着她的人是谁！他脾气糟？合着为她熬的鸡汤白熬了！动不动就暴走是为了谁！不讲道理又是为了谁！没文化？那倒是真的。所以春博士，你不来给我补补课吗？他，白路舟，为了追笨蛋春五岁什么方法都用了，可这货还是不开窍。可是能怎么办，媳妇儿是自己选的。所以，就算被嫌弃了，也还是得努力把她追回来！——春见，我家啥都不缺，唯独户口本上缺个你。', split: true }))
  })
}
