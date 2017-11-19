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
}