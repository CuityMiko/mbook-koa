import jwt from 'jsonwebtoken'
import request from 'request'
import querystring from 'querystring'
import Promise from 'bluebird'
import config from '../config'
import { User, BookList } from '../models'
import { resolve } from 'url';
import { jwtVerify } from '../utils'

const secret = 'mbook' // token秘钥
// console.log(jwt.sign({ userid: '5a1272549f292c17118aba62'}, secret, { expiresIn: '2h' }))
// console.log(jwt.sign({ userid: '5a12728f9f292c17118aba74'}, secret, { expiresIn: '2h' }))


function doRequest(url){
    return new Promise((resolve, reject) => {
        request(url, function(error, response, body){
            if(!error && response.statusCode == 200){
                resolve(JSON.parse(body))
            }else{
                reject(error || body)
            }
        })
    })
}

export default function(router) {
    router.post('/api/user/login', async(ctx, next) => {
        let { identity } = ctx.request.body
        if(identity === 'appuser'){
            let { code } = ctx.request.body
            // app用户登录
            // 向微信服务器发送请求，使用code换取openid和session_key
            let qsdata = {
                grant_type: 'authorization_code',
                appid: config.wx_appid,
                secret: config.wx_secret,
                js_code: code
            }
            let content = querystring.stringify(qsdata)
            let wxdata = await doRequest('https://api.weixin.qq.com/sns/jscode2session?' + content)
            if(wxdata.session_key && wxdata.openid){
                // 判断用户是否注册
                let user = await User.findOne({ openid: wxdata.openid })
                if(user){
                    // 已注册，生成token并返回
                    let userToken = {
                        userid: user._id
                    }
                    const token = jwt.sign(userToken, secret, { expiresIn: '2h' }) //token签名 有效期为2小时 
                    console.log('用户 ' + user._id + ' 于 ' + user.create_time.toDateString() + ' 登录')
                    ctx.body = { ok: true, msg: '登录成功', token: token, userinfo: user }
                }else{
                    // 未注册，重定向到注册页面
                    ctx.body = { ok: false, msg: '尚未注册', token: null, registe: false }
                }
            }else{
                ctx.body = { ok: false, msg: '微信认证失败' }
            }
        }else if(identity === 'adminuser'){
            // 系统管理员登录
        }else{
            ctx.body = { ok: false, msg: '缺少identity参数' }
        }
    })

    router.post('/api/user/registe', async(ctx, next) => {
        let { identity } = ctx.request.body
        if(identity === 'appuser'){
            let { code, nickName, province, country, avatarUrl } = ctx.request.body
            // app用户注册
            // 向微信服务器发送请求，使用code换取openid和session_key
            let qsdata = {
                grant_type: 'authorization_code',
                appid: config.wx_appid,
                secret: config.wx_secret,
                js_code: code
            }
            let content = querystring.stringify(qsdata)
            let wxdata = await doRequest('https://api.weixin.qq.com/sns/jscode2session?' + content)
            if(wxdata.session_key && wxdata.openid){
                let user = await User.create({
                    username: nickName, // 用户名就使用昵称
                    password: null,
                    avatar: avatarUrl,
                    identity: 1, // 区分用户是普通用户还是系统管理员
                    openid: wxdata.openid, // 小程序openid
                    amount: 0, //
                    setting: {
                      updateNotice: true,
                      reader: {
                        fontSize: 14,
                        fontFamily: '使用系统字体',
                        bright: 1,
                        mode: 0, // 模式
                      }
                    },
                    create_time: new Date()
                })
                // 已注册，生成token并返回
                let userToken = {
                    userid: user._id
                }
                const token = jwt.sign(userToken, secret, { expiresIn: '2h' }) //token签名 有效期为2小时 
                // 初始化书架
                let booklist = await BookList.create({ userid: user.id, books: [] })
                console.log('用户 ' + user._id + ' 于 ' + user.create_time.toDateString() + ' 注册, 并初始化书架')
                ctx.body = { ok: true, msg: '注册成功', token: token, userinfo: user }
            }else{
                ctx.body = { ok: false, msg: '微信认证失败' }
            }
        }else if(identity === 'adminuser'){
            // 系统管理员登录
        }else{
            ctx.body = { ok: false, msg: '缺少identity参数' }
        }
    })

    /**
     * 获取用户书币数以及当日格言
     */
    router.get('/api/user/amount', async(ctx) => {
      let token = ctx.header.authorization.split(' ')[1]
      let payload = await jwtVerify(token)
      if (payload.userid) {
          let thisUser = await User.findById(payload.userid)
          let arr = [
            '读万卷书,行万里路。 ——顾炎武',
            '读过一本好书，像交了一个益友。 ——臧克家',
            '鸟欲高飞先振翅，人求上进先读书',
            '书籍是人类思想的宝库',
            '书山有路勤为径，学海无涯苦作舟'
          ]
          let date = new Date()
          let day = date.getDate() % 5
          ctx.body = { ok: true, msg: '获取用户书币数以及当日格言成功', data: {text: arr[day], amount: thisUser.amount}}
      } else {
          ctx.body = { ok: false, msg: '认证失败，token不合法'}
      }
    })

    router.get('/api/user/get_user_setting', async(ctx) => {
      let token = ctx.header.authorization.split(' ')[1]
      let payload = await jwtVerify(token)
      if (payload.userid) {
        let thisUser = await User.findById(payload.userid)
        let result = {
          updateNotice: thisUser.setting.updateNotice,
          reader: {
            fontSize: thisUser.setting.reader.fontSize,
            fontFamily: thisUser.setting.reader.fontFamily,
            bright: thisUser.setting.reader.bright,
            mode: thisUser.setting.reader.mode, // 模式
          }
        }
        ctx.body = { ok: true, msg: '获取个人信息成功', data: result }
      } else {
        ctx.body = { ok: false, msg: 'token不合法'}
      }
    })
}
