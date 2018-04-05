import { Book, Chapter, BookList } from '../models'
import { checkAdminToken, jwtVerify, tool } from '../utils'
import convert from 'koa-convert'
import body from 'koa-better-body'
import xlsx from 'node-xlsx'

export default function (router) {
  router.get('/api/chapter/list', async(ctx, next) => {
    let { bookid } = ctx.request.query
    let thisBook = await Book.findById(bookid, 'id').populate({
      path: 'chapters',
      select: 'name num',
      options: {
        sort: {
          num: 1
        }
      }
    })
    if (thisBook) {
      ctx.body = { ok: true, msg: '获取章节列表成功', data: thisBook }
    } else {
      ctx.body = { ok: false, msg: '找不到对应的书籍' }
    }
  })

  router.get('/api/chapter/detail', async(ctx, next) => {
    let { bookid, chapter_id, chapter_num } = ctx.request.query
    let token = ctx.header.authorization.split(' ')[1]
    let payload = await jwtVerify(token)
    if(chapter_id){
      // 通过传递章节id获取章节内容
      let thisChapter = await Chapter.findById(chapter_id)
      let thisBook = await Book.findById(bookid, 'name img_url author newest_chapter')
      if (thisChapter._id) {
        ctx.body = {
          ok: true,
          msg: '获取章节详情成功',
          bookname: thisBook.name,
          headimg: thisBook.img_url,
          author: thisBook.author,
          newest: thisBook.newest_chapter,
          top: 0,
          data: thisChapter
        }
      } else {
        ctx.body = { ok: false, msg: '获取章节详情失败' }
      }
    }else if(chapter_num){
      // 通过传递章节数获取章节内容
      let thisBook = await Book.findById(bookid, 'id name img_url author newest_chapter').populate({
        path: 'chapters',
        match: {
          num: chapter_num
        }
      })
      if (thisBook.chapters[0]) {
        ctx.body = {
          ok: true,
          msg: '获取章节详情成功',
          top: 0,
          bookname: thisBook.name,
          headimg: thisBook.img_url,
          author: thisBook.author,
          newest: thisBook.newest_chapter,
          data: thisBook.chapters[0]
        }
      } else {
        ctx.body = { ok: false, msg: '获取章节详情失败' }
      }
    }else{
      // 去booklist里读取用户阅读进度
      let thisBookList = await BookList.findOne({userid: payload.userid})
      let readChapterNum = 1
      let readChapterScrollTop = 0
      thisBookList.books.forEach(item => {
        if(item.bookid.toString() == bookid){
          readChapterNum = item.read.num
          readChapterScrollTop = item.read.top
        }
      })
      let thisBook = await Book.findById(bookid, 'id name img_url author newest_chapter').populate({
        path: 'chapters',
        match: {
          num: readChapterNum
        }
      })
      if (thisBook.chapters[0]) {
        ctx.body = {
          ok: true,
          msg: '获取章节详情成功',
          top: readChapterScrollTop,
          bookname: thisBook.name,
          headimg: thisBook.img_url,
          author: thisBook.author,
          newest: thisBook.newest_chapter,
          data: thisBook.chapters[0]
        }
      } else {
        ctx.body = { ok: false, msg: '获取章节详情失败' }
      }
    }
  })

  router.get('/api/chapter/search', async (ctx, next) => {
    let { bookid, str } = ctx.request.query
    let queryArr = []
    queryArr.push({ name: new RegExp(str, 'igm') })
    let numReg = /^\d+$/
    if(numReg.test(str)){
      queryArr.push({ num: str })
    }
    if(bookid){
      if(str){
        let thisBook = await Book.findById(bookid, 'id').populate({
          path: 'chapters',
          match: { $or: queryArr },
          select: 'name num',
          options: {
            sort: {
              num: 1
            }
          }
        })
        ctx.body = { ok: true, msg: '搜索目录成功', data: thisBook }
      }else{
        let thisBook = await Book.findById(bookid, 'id').populate({
          path: 'chapters',
          select: 'name num',
          options: {
            sort: {
              num: 1
            }
          }
        })
        if (thisBook) {
          ctx.body = { ok: true, msg: '搜索目录成功', data: thisBook }
        } else {
          ctx.body = { ok: false, msg: '找不到对应的书籍' }
        }
      }
    }else{
        ctx.body = { ok: false, msg: '获取书籍信息失败，bookid不存在' }
    }
  })

  /**
   * 章节管理后台管理系统
   */
  router.get('/api/:book_id/chapter', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'chapter_get')
    if (userid) {
      let id = ctx.params.book_id
      let { page, limit } = ctx.request.query
      // format page and limit
      if(page){
        page = parseInt(page)
      }else{
        page = 1
      }
      if(limit){
        limit = parseInt(limit)
      }else{
        limit = 10
      }
      // query book
      let thisBook = await Book.findById(id, 'name newest_chapter chapters').populate({
        path: 'chapters',
        model: 'Chapter',
        options: {skip: (page - 1) * limit, limit: limit, sort: {'num': 1}}
      })
      let total = (await Book.findById(id, 'chapters')).chapters.length
      if(thisBook){
        ctx.body = { ok: true, msg: '获取章节成功', total: total, data: thisBook }
      }else{
        ctx.body = { ok: false, msg: '获取章节失败，找不到这样的书籍' }
      }
    }
  })
  // add
  router.post('/api/:book_id/chapter', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'chapter_get')
    if (userid) {
      let id = ctx.params.book_id
      let { num, name, content } = ctx.request.body
      // format page and limit
      if(num || num === 0){
        num = parseInt(num)
        if(name){
          if(content){
            // 判断num是否重复
            // 检查num是否重复
            let oldChapter = await Book.findById(id).populate({
              path: 'chapters',
              select: 'num'
            })
            let isExist = oldChapter.chapters.some(item => {
              return item.num == num
            })
            if(!isExist){
              let addResult = await Chapter.create({
                num,
                name,
                content,
                create_time: new Date()
              })
              // 更新book.chapters
              if(addResult._id) {
                let updateResult = await Book.update({_id: id}, {
                  $addToSet: {
                    chapters: addResult._id
                  }
                })
                if(updateResult.ok){
                  ctx.body = { ok: true, msg: '新增章节成功', data: addResult } 
                }else{
                  ctx.body = { ok: false, msg: '新增章节失败' } 
                }
              }else{
                ctx.body = { ok: false, msg: '新增章节失败' } 
              }
            }else{
              ctx.body = { ok: false, msg: '章节序号重复' } 
            }
          }else{
           ctx.body = { ok: false, msg: '章节内容不能为空' } 
          }
        }else{
         ctx.body = { ok: false, msg: '章节名不能为空' } 
        }
      }else{
       ctx.body = { ok: false, msg: '章节序数不能为空' } 
      }
    }
  })
  // delete
  router.delete('/api/:book_id/chapter/:chapter_id', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'chapter_get')
    if (userid) {
      let book_id = ctx.params.book_id
      let chapter_id = ctx.params.chapter_id
      let thisBook = await Book.findById(book_id, 'chapters')
      let newChapters = thisBook.chapters.filter(item => {
        return item.toString() !== chapter_id
      })
      await Chapter.remove({_id: chapter_id})
      let updateResult = await Book.update({_id: book_id}, {
        $set: {
          chapters: newChapters
        }
      })
      if(updateResult.ok){
        ctx.body = { ok: true, msg: '删除章节成功' }
      }else{
        ctx.body = { ok: false, msg: '删除章节失败' }
      }
    }
  })
  // 后台书籍列表更新
  router.patch('/api/chapter/:id', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'theme_update')
    if (userid) {
      let { name, num, author, content } = ctx.request.body
      let id = ctx.params.id
      let result = await Chapter.update({ _id: id },
        {
          $set: {
            name: name,
            num: num,
            content: content
          }
        })
      if (result.ok === 1) {
        let newest = await Chapter.findById(id)
        ctx.body = { ok: true, msg: '更新章节成功', data: newest }
      } else {
        ctx.body = { ok: false, msg: '更新章节失败', data: result }
      }
    }
  })
  // 后台章节upload
  router.post('/api/:book_id/chapter_upload', convert(body()), async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'theme_update')
    if (userid) {
      let book_id = ctx.params.book_id
      let addErrors = []
      let rightNum = 0
      async function saveChapter(index, num, name, content){
        if(num || num === 0){
          num = parseInt(num)
          if(name){
            if(content){
              // 判断num是否重复
              // 检查num是否重复
              let oldChapter = await Book.findById(book_id).populate({
                path: 'chapters',
                select: 'num'
              })
              let isExist = oldChapter.chapters.some(item => {
                return item.num == num
              })
              if(!isExist){
                let addResult = await Chapter.create({
                  num,
                  name,
                  content,
                  create_time: new Date()
                })
                // 更新book.chapters
                if(addResult._id) {
                  let updateResult = await Book.update({_id: book_id}, {
                    $addToSet: {
                      chapters: addResult._id
                    }
                  })
                  if(updateResult.ok){
                    rightNum ++
                  }else{
                    addErrors.push('第' + (++index) + '行更新Book.chapters失败')
                  }
                }else{
                  addErrors.push('第' + (++index) + '行新增章节失败')
                }
              }else{
                addErrors.push('第' + (++index) + '行章节序号重复')
              }
            }else{
              addErrors.push('第' + (++index) + '行章节内容不能为空')
            }
          }else{
            addErrors.push('第' + (++index) + '行章节名不能为空')
          }
        }else{
          addErrors.push('第' + (++index) + '行章节序数不能为空')
        }
      }
      try {
        let uploadData = xlsx.parse(ctx.request.files[0].path)
        // 保存章节
        if(uploadData && uploadData[0] && uploadData[0].data){
          if(uploadData[0].data[0] instanceof Array && uploadData[0].data[0][0] === '章节序号'){
            for(let i=1; i<uploadData[0].data.length; i++){
              console.log(i, uploadData[0].data[i][0], uploadData[0].data[i][1], uploadData[0].data[i][2])
              await saveChapter(i, uploadData[0].data[i][0], uploadData[0].data[i][1], uploadData[0].data[i][2])
            }
            ctx.body = { ok: true, msg: '上传成功', errors: addErrors, success: rightNum }
          }else{
            ctx.body = { ok: false, msg: 'excel文件格式错误' }
          }
        }else{
          ctx.body = { ok: false, msg: 'excel文件格式错误' }
        }
      }catch(err){
        console.log(err)
        ctx.body = { ok: false, msg: '上传并存储章节失败', error: err }
      }
    }
  })
}
