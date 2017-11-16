import { Book } from '../models'

export default function (router) {
  router.post('/api/book', async (ctx, next) => {
      let { name, img_url, author, des, classification, update_status, newest_chapter, total_words, hot_value, update_time } = ctx.request.body
      console.log(ctx.request.body)
      let book = await Book.create({
        name: name,
        img_url: img_url,
        author: author,
        des: des,
        classification: classification,
        update_status: update_status,
        newest_chapter: newest_chapter,
        total_words: total_words,
        hot_value: hot_value,
        update_time: new Date(update_time),
        create_time: new Date()
      })
      if(book){
        ctx.body = { ok: true, msg: '添加书籍成功', data: book }
      }else{
        ctx.body = { ok: false, msg: '添加书籍失败' }
      }
  })

  router.put('/api/book', async (ctx, next) => {
    let {id, name, img_url, author, des, classification, update_status, newest_chapter, total_words, hot_value, update_time } = ctx.request.body
    if(id){
      let book = await Book.update({_id: id}, {
        $set : {
          name: name,
          img_url: img_url,
          author: author,
          des: des,
          classification: classification,
          update_status: update_status,
          newest_chapter: newest_chapter,
          total_words: total_words,
          hot_value: hot_value,
          update_time: new Date(update_time)
        } 
      })
      if(book.ok === 1){
        ctx.body = { ok: true, msg: '更新书籍成功' }
      }else{
        ctx.body = { ok: false, msg: '更新书籍失败' }
      }
    }else{
      ctx.body = { ok: false, msg: '缺少id参数' }
    }
  })

  router.delete('/api/book', async (ctx, next) => {
    let id = ctx.request.query.id
    if(id){
      let book = await Book.remove({ _id : id })
      if(book.result.ok === 1){
        ctx.body = { ok: true, msg: '删除书籍成功' }
      }else{
        ctx.body = { ok: false, msg: '删除书籍失败', data: book.result }
      }
    }else{
      ctx.body = { ok: false, msg: '缺少id参数' }
    }
  })
}
