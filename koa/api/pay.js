import { Pay, Good } from '../models'
import WeiXinPay from 'weixin-pay'

export default function (router) {
    router.post('/api/pay', async (ctx, next) => {
        let { pay_money, yuebi_num } = ctx.request.body
        let payload = await jwtVerify(ctx.header.authorization.split(' ')[1])
        if(payload && payload.userid){
            
        }else{
            ctx.throw('token过期', 401)
            await next()
        }
    })
}
