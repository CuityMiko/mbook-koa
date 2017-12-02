import { Buy, Good } from '../models'

export default function (router) {
    router.get('/api/buy/list', async (ctx, next) => {
        // 获取url参数
        ctx.body = { ok: true, msg: '获取banner成功', list: {} }
    })
}
