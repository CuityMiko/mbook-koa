import { Book, BookList, User, Comment } from '../models'
import { checkUserToken, tool } from '../utils'

export default function (router) {
  router.post('/api/comment/add', async (ctx, next) => {
    // 解析jwt，取出userid查询booklist表，判断是否已经加入了书架
    let userid = await checkUserToken(ctx, next)
    if (userid) {
      let { bookid, content, father } = ctx.request.body
      if (bookid) {
        if (content) {
          let thisComent = await Comment.create({
            userid: await Comment.transId(userid),
            bookid: await Comment.transId(bookid),
            father: father ? await Comment.transId(father) : null,
            content: content,
            like_num: 0,
            create_time: new Date()
          })
          let thisUser = await User.findById(userid)
          if (thisUser) {
            let result = {
              id: thisComent._id,
              username: thisUser.username,
              avatar: thisUser.avatar,
              userid: thisUser._id,
              father: thisComent.father,
              content: thisComent.content,
              is_like: false,
              like_num: 0,
              childs: [],
              create_time: tool.formatTime2(thisComent.create_time)
            }
            ctx.body = { ok: true, msg: '发表书评成功!', data: result }
          } else {
            ctx.body = { ok: false, msg: '用户信息错误' }
          }
        } else {
          ctx.body = { ok: false, msg: '评论内容不能为空' }
        }
      } else {
        ctx.body = { ok: false, msg: '获取书籍信息失败' }
      }
    }
  })

  router.get('/api/comment/like', async (ctx, next) => {
    // 解析jwt，取出userid查询booklist表，判断是否已经加入了书架
    let userid = await checkUserToken(ctx, next)
    if (userid) {
      let { commentid, op } = ctx.request.query
      if (op == 'add') {
        let updateResult = await Comment.update({ _id: commentid }, { $addToSet: { like_persons: await Comment.transId(userid) } })
        let currentComment = await Comment.findById(commentid)
        if (updateResult.ok == 1 && updateResult.nModified == 1) {
          ctx.body = { ok: true, msg: '点赞成功', current: currentComment.like_persons.length }
        } else {
          ctx.body = { ok: false, msg: '点赞失败~', current: currentComment.like_persons.length }
        }
      } else if (op == 'remove') {
        let oldComment = await Comment.findById(commentid)
        let comments = oldComment.like_persons.filter(item => {
          return item.toString() != userid
        })
        if (comments.length < oldComment.like_persons.length) {
          let updateResult = await Comment.update({ _id: commentid }, { $set: { like_persons: comments } })
          let currentComment = await Comment.findById(commentid)
          if (updateResult.ok == 1 && updateResult.nModified == 1) {
            ctx.body = { ok: true, msg: '取消点赞成功', current: currentComment.like_persons.length }
          } else {
            ctx.body = { ok: false, msg: '取消点赞失败~', current: currentComment.like_persons.length }
          }
        } else {
          ctx.body = { ok: false, msg: '取消点赞失败~' }
        }
      } else {
        ctx.body = { ok: false, msg: '点赞失败, 缺少op参数~' }
      }
    }
  })

  router.get('/api/comment/list', async (ctx, next) => {
    // 解析jwt，取出userid查询booklist表，判断是否已经加入了书架
    let userid = await checkUserToken(ctx, next)
    if (userid) {
      let { bookid } = ctx.request.query
      let result = []
      if (bookid) {
        // 先查询所有的根评论
        let rootComments = await Comment.find({ bookid: bookid, father: null })
          .populate('userid')
          .sort({ create_time: -1 })
        for (let i = 0; i < rootComments.length; i++) {
          let isLike = rootComments[i].like_persons.some(item => {
            return item.toString() == userid
          })
          // 查找所有的子评论
          result.push({
            id: rootComments[i]._id,
            userid: rootComments[i].userid._id,
            avatar: rootComments[i].userid.avatar,
            username: rootComments[i].userid.username,
            content: rootComments[i].content,
            like_num: rootComments[i].like_persons.length,
            is_like: isLike,
            childs: [],
            create_time: tool.formatTime2(rootComments[i].create_time)
          })
        }
        // 对于每个根评论去获取他的子评论
        for (let i = 0; i < result.length; i++) {
          let allChildComments = []
          let findChildAndSon = async function (commentid, username, userid) {
            let childComments = await Comment.find({ bookid: bookid, father: commentid })
              .populate('userid')
              .sort({ create_time: 1 })
            let childCommentsToSave = []
            childComments.forEach(function (childItem) {
              childCommentsToSave.push({
                id: childItem._id,
                userid: childItem.userid._id,
                username: childItem.userid.username,
                reply: {
                  userid: userid,
                  username: username
                },
                content: childItem.content,
                like_num: childItem.like_persons.length,
                create_time: tool.formatTime2(childItem.create_time)
              })
            })
            allChildComments = allChildComments.concat(childCommentsToSave)
            // when this comment has child
            if (childComments.length > 0) {
              for (let k = 0; k < childComments.length; k++) {
                await findChildAndSon(childComments[k]._id, childComments[k].userid.username, childComments[k].userid._id)
              }
            }
          }
          await findChildAndSon(result[i].id, result[i].username, result[i].userid)
          result[i].childs = allChildComments
        }
        ctx.body = { ok: true, msg: '获取评论成功!', list: result }
      } else {
        ctx.body = { ok: false, msg: '缺少bookid参数' }
      }
    }
  })

  // 小程序获取回复自己的评论
  router.get('/api/comment/my', async (ctx, next) => {
    let userid = await checkUserToken(ctx, next)
    if (userid) {
      // 获取到用户发布的所有评论
      const myComments = await Comment.find({ userid }, '_id like_persons')
        .populate({
          path: 'like_persons',
          select: 'username avatar'
        })
        .sort({ create_time: -1 })
      let likeComment = []
      let replyComments = []
      for (let i = 0; i < myComments.length; i++) {
        myComments[i].like_persons.forEach(likeItem => {
          likeComment.push({
            commentid: myComments[i]._id,
            avatar: likeItem.avatar,
            name: likeItem.username
          })
        })
        const reply = await Comment.find({ father: myComments[i]._id }, '_id bookid userid content create_time')
          .populate({
            path: 'userid',
            select: 'username avatar'
          })
          .sort({ create_time: -1 })
        reply.forEach(replyItem => {
          replyComments.push({
            commentid: replyItem._id,
            bookid: replyItem.bookid,
            avatar: replyItem.userid.avatar,
            name: replyItem.userid.username,
            content: replyItem.content,
            time: replyItem.create_time
          })
        })
      }
      ctx.body = {
        ok: true,
        msg: '获取我的消息成功',
        like: likeComment,
        reply: replyComments
      }
    }
  })
}
