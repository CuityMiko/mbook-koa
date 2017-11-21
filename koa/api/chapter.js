import { Book, Chapter } from '../models'
import { jwtVerify, tool } from '../utils'

export default function (router) {
    router.post('/api/chapter/add', async (ctx, next) => {
      let { bookid, name, num, content } = ctx.request.body
      // 插入章节
      let thisChapter = await Chapter.create({
        name: name,
        num: num,
        content: content,
        create_time: new Date()
      })
      // 更新book表
      let thisBook = await Book.update({_id: bookid}, {'$addToSet': {chapters: thisChapter.id}})
      if(thisBook.ok == 1 && thisBook.nModified == 1){
        ctx.body = { ok: true, msg: '新增章节成功' }
      }else{
        ctx.body = { ok: false, msg: '新增失败，章节重复' }
      }
    })

    router.get('/api/chapter/list', async (ctx, next) => {
      let { bookid } = ctx.request.query
      let thisBook = await Book.findById(bookid, 'id').populate({path: 'chapters', select: {num: 1, name: 1}, options: {sort: {num: 1}}})
      if(thisBook._id){
        ctx.body = { ok: true, msg: '获取章节列表成功', data: thisBook }
      }else{
        ctx.body = { ok: true, msg: '找不到对应的书籍' }
      }
    })

    router.get('/api/chapter/detail', async (ctx, next) => {
      let { chapter_id } = ctx.request.query
      let thisChapter = await Chapter.findById(chapter_id)
      if(thisChapter._id){
        ctx.body = { ok: true, msg: '获取章节详情成功', data: thisChapter }
      }else{
        ctx.body = { ok: true, msg: '获取章节详情失败' }
      }
    })
}
