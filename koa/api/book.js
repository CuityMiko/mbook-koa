import { Book, BookList } from '../models'
import { jwtVerify, tool } from '../utils'

export default function (router) {
    router.get('/api/book/get_detail', async (ctx, next) => {
        let result = null
        let id = ctx.request.query.id
        if (id) {
            let book = await Book.findById(id)
            if (book) {
                // 解析jwt，取出userid查询booklist表，判断是否已经加入了书架
                let token = ctx.header.authorization.split(' ')[1]
                let payload = await jwtVerify(token)
                let hisBookList = await BookList.findOne({ userid: payload.userid })
                let isInList = hisBookList.books.some(item => {
                    return item.bookid.toString() === id
                })
                // 格式化时间
                result = {
                    '_id': book._id,
                    'name': book.name,
                    'img_url': book.img_url,
                    'author': book.author,
                    'des': book.des,
                    'classification': book.classification,
                    'update_status': book.update_status,
                    'newest_chapter': book.newest_chapter,
                    'total_words': book.total_words,
                    'hot_value': book.hot_value,
                    'update_time': tool.formatTime(book.update_time),
                }
                ctx.body = { ok: true, msg: '获取书籍详情成功', data: result, isInList: isInList }
            } else {
                ctx.body = { ok: false, msg: '获取书籍详情失败' }
            }
        } else {
            ctx.body = { ok: false, msg: '缺少id参数' }
        }
    })
}