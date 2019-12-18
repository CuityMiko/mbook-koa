import { Book } from '../models'

export default function(router) {
  /**
   * 前端接口
   * 推荐书籍接口
   */
  router.post('/api/front/recommend', async ctx => {
    const { userid, key = 'default' } = ctx.request.body

    ctx.body = {
      ok: true,
      msg: '获取语音成功',
      hasMore: true,
      list: [
        {
          _id: '5b13ed1491883d2704fd847b',
          name: '总裁爹地的宠妻法则',
          img_url: 'https://file.lantingshucheng.com/1528034798960.jpeg',
          author: '程漓月宫夜霄',
          des: '她想要求救，鼻间传来浓郁的男性气息，扑天盖地的涌来，她微微轻启的唇被强势堵住。 她本能的想要反抗，可是，男人不给她任何机会，长驱直入，挑开她的齿，吞卷她的一切。'
        },
        {
          _id: '5b14013b91883d2704fd88a4',
          name: '余生与你共相守',
          img_url: 'https://file.lantingshucheng.com/1528037614557.jpeg',
          author: '苏洛洛龙夜爵',
          des: '为了母亲手术费，她答应了父亲自私的要求，成为姐姐的替身。黑暗掩盖，一夜荒唐……一夜之间，她失去所有，不得不狼狈出国。五年后，她携带一对萌宝回归！天子骄子一般的男人突然降临，拦住她的去路。“女人，敢偷生我的孩子？”她惊慌失措，“你认错人了，当年那个人是我姐姐。”“那晚是谁，我心里还会没数？'
        },
        {
          _id: '5b1402f491883d2704fd8db8',
          name: '初夏若雨等花开',
          img_url: 'https://file.lantingshucheng.com/1528038122853.jpeg',
          author: '唐思雨邢烈寒',
          des:
            '一场渡假，被当小，姐，回国还撞见未婚夫背叛。她怒然消失离开。五年后，她带着天才萌宝回归。小宝参加钢琴大赛，哪料到，儿子竟然还打着找老爸的算盘。“镜头往这边，把我拍帅一点！我叫唐宝，我的妈咪叫唐思雨，超漂亮的哦！我今年四岁半，有长得像我，并且，有可能是我爹地的男人，请一定要联系我哦！”说完，还不忘朝镜头道，“爹地，等你哦！”后台，某女人已气疯。'
        },
        {
          _id: '5b14043c91883d2704fd8db9',
          name: '忆往昔年华似锦',
          img_url: 'https://file.lantingshucheng.com/1528038404691.jpeg',
          author: '李见微严谨',
          des: '我叫李见微，见微知著的见微。我是一名医生，结婚两年，刚拿证丈夫就被调去了国外工作，没有回过国，我们靠视频联系，更像是谈着异地恋爱的小情侣。　　我一直以为自己的感情还算美满和睦。可我做梦都没有想到，丈夫为了逼我净身出户，竟把其他男人送上我的床，并且拍下了我婚内出轨的证据。'
        },
        {
          _id: '5b14057691883d2704fd8fa7',
          name: '凉宫',
          img_url: 'https://file.lantingshucheng.com/1528038756657.jpeg',
          author: '冷琉璃君无霜',
          des: '她是银衣卫统领，为他打下江山，可他厌恶她手上的鲜血。冷琉璃不知道，自他们相遇的那一刻，不幸的命运已经写好。'
        },
        {
          _id: '5b14061391883d2704fd8fd1',
          name: '月光如水照心扉',
          img_url: 'https://file.lantingshucheng.com/1528038925142.jpeg',
          author: '唐悠悠季枭寒',
          des: '惨遭继母陷害，她与神秘男子一夜缠绵，最终被逼远走他国。五年后，她携带一对漂亮的龙凤宝贝回归！却在回国当天，就惹上了高冷俊美的大总裁，更令她震惊的是，这位大总裁和儿子的长相如出一辙！'
        }
      ]
    }
  })
}
