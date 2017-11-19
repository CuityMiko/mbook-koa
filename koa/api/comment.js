import { Book, BookList, User, Comment } from '../models'
import { jwtVerify, tool } from '../utils'

export default function (router) {
  router.post('/api/comment/add', async (ctx, next) => {
    // 解析jwt，取出userid查询booklist表，判断是否已经加入了书架
    let token = ctx.header.authorization.split(' ')[1]
    let payload = await jwtVerify(token)
    let { bookid, content, father } = ctx.request.body

    let thisComent = await Comment.create({
      userid: await Comment.transId(payload.userid),
      bookid: await Comment.transId(bookid),
      father: father ? (await Comment.transId(father)) : null,
      content: content,
      like_num: 0,
      create_time: new Date()
    })
    ctx.body = { ok: true, msg: '发表书评成功!', data: thisComent }
  })

  router.get('/api/comment/list', async (ctx, next) => {
    let { bookid } = ctx.request.query
    let result = []
    if(bookid){
      // 先查询所有的根评论
      let rootComments = await Comment.find({ bookid: bookid, father: null }).populate('userid').sort({create_time: -1})
      let findChildComment = async function(fatherId){
        let childs = []
        let childComments = await Comment.find({ father: fatherId }).populate('userid').populate('father').sort({create_time: 1})
        if(childComments.length == 0){
          return
        }else{
          for(let i=0; i<childComments.length; i++){
            // 查找回复人
            let replyPerson = await User.findById(childComments[i].father.userid)
            // 查找所有的子评论
            childs.push({
              userid: childComments[i].userid._id,
              username: childComments[i].userid.username,
              reply: {
                userid: childComments[i].father.userid,
                username: replyPerson.username
              },
              content: childComments[i].content,
              create_time: tool.formatTime2(childComments[i].create_time)
            })
            console.log('________', await findChildComment(childComments[i]._id))
            childs.concat(await findChildComment(childComments[i]._id))
          }
        }
        console.log('&&&&', childs)
        return childs
      }
      for(let i=0; i<rootComments.length; i++){
        // 查找所有的子评论
        result.push({
          userid: rootComments[i].userid._id,
          avatar: rootComments[i].userid.avatar,
          username: rootComments[i].userid.username,
          content: rootComments[i].content,
          childs: await findChildComment(rootComments[i]._id),
          create_time: tool.formatTime2(rootComments[i].create_time)
        })
      }
      ctx.body = { ok: true, msg: '获取评论成功!', data: result }
    }else{
      ctx.body = { ok: false, msg: '缺少bookid参数' }
    }
  })
}