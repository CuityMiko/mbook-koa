import { Book } from '../models'

export default function(router) {
    router.get('/api/book/get_detail', async(ctx, next) => {
        let id = ctx.request.query.id
        if (id) {
            let book = await Book.findById(id)
            if (book) {
                ctx.body = { ok: true, msg: '获取书籍详情成功', data: book }
            } else {
                ctx.body = { ok: false, msg: '获取书籍详情失败' }
            }
        } else {
            ctx.body = { ok: false, msg: '缺少id参数' }
        }
    })
}