import { Banner } from '../models'

export default function (router) {
    router.get('/api/banner', async (ctx, next) => {
        ctx.body = {
            ok: true,
            data: []
        }
    })
}
