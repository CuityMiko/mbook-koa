import { BookList } from '../models'
import { jwtVerify, tool } from '../utils'

export default function(router) {
    router.get('/api/booklist/remove_book', async(ctx, next) => {
        let id = ctx.request.query.id
        if (id) {
            let token = ctx.header.authorization.split(' ')[1]
            let payload = await jwtVerify(token)
            let hisBookList = await BookList.findOne({ userid: payload.userid })
            let newBookList = []
            let count = 0
            for(let i=0; i<hisBookList.books.length; i++){
              if(hisBookList.books[i].bookid.toString() !== id){
                newBookList.push({
                  bookid: hisBookList.books[i].bookid,
                  index: count
                })
                count ++
              }
            }
            if(newBookList.length === hisBookList.books.length){
              ctx.body = { ok: false, msg: '书籍不在书架中' }
            }else if(newBookList.length < hisBookList.books.length){
              let updateResult = await BookList.update({userid: payload.userid}, {'$set': {'books': newBookList}})
              if(updateResult.ok === 1){
                ctx.body = { ok: true, msg: '删除书籍成功' }
              }else{
                ctx.body = { ok: false, msg: '删除书籍失败' }
              }
            }
        } else {
            ctx.body = { ok: false, msg: '缺少id参数' }
        }
    })

    router.get('/api/booklist/add_book', async(ctx, next) => {
      let id = ctx.request.query.id
      if (id) {
          let token = ctx.header.authorization.split(' ')[1]
          let payload = await jwtVerify(token)
          let hisBookList = await BookList.findOne({ userid: payload.userid })
          let bookids = []
          for(let i=0; i<hisBookList.books.length; i++){
            if(hisBookList.books[i].bookid.toString() === id){
              bookids.push(hisBookList.books[i].bookid.toString())
            }
          }
          bookids = tool.unique(bookids.concat([id]))
          let newBookList = []
          for(let i=0; i<bookids.length; i++){
            newBookList.push({
              bookid: await BookList.transId(bookids[i]),
              index: i
            })
          }
          if(newBookList.length === hisBookList.books.length){
            ctx.body = { ok: false, msg: '书籍已经在书架中' }
          }else if(newBookList.length > hisBookList.books.length){
            let updateResult = await BookList.update({userid: payload.userid}, {'$set': {'books': newBookList}})
            if(updateResult.ok === 1){
              ctx.body = { ok: true, msg: '添加书籍成功' }
            }else{
              ctx.body = { ok: false, msg: '添加书籍失败' }
            }
          }else{
            ctx.body = { ok: false, msg: '添加书籍失败' }
          }
      } else {
          ctx.body = { ok: false, msg: '缺少id参数' }
      }
  })

  // 更新用户阅读进度接口
  router.post('/api/booklist/update_read', async(ctx, next) => {
    let token = ctx.header.authorization.split(' ')[1]
    let payload = await jwtVerify(token)
    let { bookid, chapter_num, chapter_page_num } = ctx.request.body
    if(payload.userid){
      if(bookid && chapter_num && chapter_page_num){
        let thisBookList = await BookList.findOne({ userid: payload.userid })
        let newBooks = thisBookList.books.map(item => {
          if(item.bookid.toString() == bookid){
            item.read = {
              num: chapter_num,
              page: chapter_page_num
            }
            return item
          }else{
            return item
          }
        })
        let updateResult = await BookList.update({ userid: payload.userid }, { '$set': { 'books': newBooks } })
        if(updateResult.ok == 1){
          if(updateResult.nModified == 1){
            ctx.body = { ok: true, msg: '更新阅读进度成功，最新进度第 ' + chapter_num + ' 章 第 ' + chapter_page_num + ' 页' }
          }else{
            ctx.body = { ok: true, msg: '阅读进度没有改动' }
          }
        }else{
          ctx.body = { ok: false, msg: '更新阅读进度失败' }
        }
      }else{
        ctx.body = { ok: false, msg: '更新阅读进度失败，参数错误' }
      }
    }else{
      ctx.body = { ok: false, msg: '更新阅读进度失败，用户信息错误' }
    }
  })
}
