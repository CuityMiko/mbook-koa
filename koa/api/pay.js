import { Pay, Good } from '../models'

export default function (router) {
    router.post('/api/pay', async (ctx, next) => {
        let payload = await jwtVerify(ctx.header.authorization.split(' ')[1])
        if(payload && payload.userid){
            
        }else{
            ctx.throw('token过期', 401)
            await next()
        }
    })
}
