import { Book, BookList, User, Comment } from '../models'
import { checkUserToken, tool, checkAdminToken } from '../utils'
import moment from 'moment'
import config from '../config'

export default function(router) {
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
          let findChildAndSon = async function(commentid, username, userid) {
            let childComments = await Comment.find({ bookid: bookid, father: commentid })
              .populate('userid')
              .sort({ create_time: 1 })
            let childCommentsToSave = []
            childComments.forEach(function(childItem) {
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

  // 后台相关接口
  router.get('/api/comment/admin', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'comment_admin_get')
    if (!userid) {
      return false
    }
    let { page, limit, bookid } = ctx.request.query
    // format page and limit
    if (page) {
      page = parseInt(page)
    } else {
      page = 1
    }
    if (limit) {
      limit = parseInt(limit)
    } else {
      limit = 10
    }
    let conf = {}
    if (bookid) {
      conf.bookid = bookid
    }
    let total = await Comment.count(conf);
    let comments = await Comment.find(conf)
      .populate({
        path: 'bookid',
        model: 'Book',
        select: { name: 1 }
      })
      .populate({
        path: 'userid',
        model: 'User',
        select: { username: 1 }
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ create_time: -1 })
    ctx.body = { ok: true, msg: '获取评论成功', total, list: comments }
  })

  router.post('/api/comment/reply', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'comment_admin_get')
    if (!userid) {
      return false
    }
    let { bookid, commentid, content, send_message } = ctx.request.body
    if (!bookid) {
      ctx.body = { ok: false, msg: '参数错误，缺乏bookid参数' }
      return false
    }
    if (!commentid) {
      ctx.body = { ok: false, msg: '参数错误，缺乏commentid参数' }
      return false
    }
    if (!content) {
      ctx.body = { ok: false, msg: '参数错误，缺乏content参数' }
      return false
    }
    send_message = !!send_message
    // 创建一条系统回复评论
    // 当前书籍
    let curBook = await Book.findById(bookid, 'name')
    if (!curBook) {
      ctx.body = { ok: false, msg: '评论未找到' }
      return false
    }
    // 当前评论
    let curComment = await Comment.findById(commentid, 'content userid')
    if (!curComment) {
      ctx.body = { ok: false, msg: '评论未找到' }
      return false
    }
    // 查找管理员
    let adminUser = await User.findOne({ username: config.adminUserName })
    if (!adminUser) {
      ctx.body = { ok: false, msg: '系统管理员未找到' }
      return false
    }
    let newComment = await Comment.create({
      userid: await Comment.transId(adminUser._id),
      bookid: await Comment.transId(bookid),
      father: commentid ? await Comment.transId(commentid) : null,
      content: content,
      like_num: 0,
      create_time: new Date()
    })
    // 发送模板消息
    if (send_message) {
      User.sendMessage(
        curComment.userid.toString(),
        'comment',
        {
          keyword1: { value: `《${curComment.content}》` },
          keyword2: { value: curBook.name },
          keyword3: { value: '系统管理员' },
          keyword4: { value: moment(newComment.create_time).format('YYYY年MM月DD日 HH:mm:ss') },
          keyword5: { value: '点击查看详情' }
        },
        { bookid: bookid }
      )
    }
    ctx.body = { ok: true, msg: '回复成功', data: newComment }
  })

  router.post('/api/comment/delete', async (ctx, next) => {
    const userid = await checkAdminToken(ctx, next, 'comment_admin_get')
    if (!userid) {
      return false
    }
    const commentid = ctx.request.body.commentid
    const bookid = ctx.request.body.bookid
    let curComment = await Comment.findById(commentid)
    if (!curComment) {
      ctx.body = { ok: false, msg: '评论未找到' }
      return false
    }
    let curBook = await Book.findById(bookid, 'name')
    if (!curBook) {
      ctx.body = { ok: false, msg: '评论未找到' }
      return false
    }
    // 找出当前评论以及当前评论的子评论
    let comments = []
    comments.push(commentid)
    let findChildAndSon = async function(commentId) {
      let childComments = await Comment.find({ bookid: bookid, father: commentId })
      let childCommentsToSave = []
      childComments.forEach(function(childItem) {
        childCommentsToSave.push(childItem._id.toString())
      })
      comments = comments.concat(childCommentsToSave)
      // when this comment has child
      if (childComments.length > 0) {
        for (let k = 0; k < childComments.length; k++) {
          await findChildAndSon(childComments[k]._id)
        }
      }
    }
    await findChildAndSon(commentid)
    let deleTeResult = await Comment.remove({ _id: { $in: comments } })
    if (deleTeResult.result.ok === 1) {
      ctx.body = { ok: true, msg: '删除评论成功' }
    } else {
      ctx.body = { ok: false, msg: '删除评论失败', data: deleTeResult.result }
    }
  })
}
