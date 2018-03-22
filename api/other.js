export default function (router) {
    router.get('/api/get_text', async (ctx, next) => {
        let arr = [
          '读万卷书,行万里路。 ——顾炎武',
          '读过一本好书，像交了一个益友。 ——臧克家',
          '鸟欲高飞先振翅，人求上进先读书',
          '书籍是人类思想的宝库',
          '书山有路勤为径，学海无涯苦作舟'
        ]
        let date = new Date()
        let day = date.getDate() % 5
        ctx.body = { ok: true, text: arr[day] }
    })

    router.get('/help', async(ctx, next) => {
        await ctx.render('help', {
            title: '帮助与反馈'
        })
    })

    router.get('/notice', async(ctx, next) => {
        await ctx.render('notice', {
            title: '关注公众号'
        })
    })
}
