import jwt from 'jsonwebtoken'
import request from 'request'
import querystring from 'querystring'
import Promise from 'bluebird'
import config from '../config'
import { User, BookList } from '../models'
import { resolve } from 'url'
import { checkUserToken, checkAdminToken } from '../utils'

const secret = 'mbook' // token秘钥
// console.log(jwt.sign({ userid: '5a1272549f292c17118aba62' }, secret, { expiresIn: '2h' }))
// console.log(jwt.sign({ userid: '5a12728f9f292c17118aba74'}, secret, { expiresIn: '2h' }))

function doRequest(url) {
  return new Promise((resolve, reject) => {
    request(url, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        resolve(JSON.parse(body))
      } else {
        reject(error || body)
      }
    })
  })
}

export default function(router) {
  router.post('/api/user/login', async (ctx, next) => {
    let { identity } = ctx.request.body
    identity = parseInt(identity)
    if (identity === 1) {
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
      if (wxdata.session_key && wxdata.openid) {
        // 判断用户是否注册
        let user = await User.findOne({
          openid: wxdata.openid
        })
        if (user) {
          // 已注册，生成token并返回
          let userToken = {
            userid: user._id
          }
          const token = jwt.sign(userToken, secret, {
            expiresIn: '4h'
          }) //token签名 有效期为2小时
          console.log('用户 ' + user._id + ' 于 ' + user.create_time.toDateString() + ' 登录')
          const booklist = await BookList.findOne({ userid: user._id }, 'books')
          let allBooks = []
          if (booklist) {
            allBooks = booklist.books.map(item => {
              return item.bookid
            })
          }
          ctx.body = {
            ok: true,
            msg: '登录成功',
            token: token,
            userinfo: user,
            // 额外返回信息
            allbooks: allBooks
          }
        } else {
          // 未注册，重定向到注册页面
          ctx.body = {
            ok: false,
            msg: '尚未注册',
            token: null,
            registe: false
          }
        }
      } else {
        ctx.body = {
          ok: false,
          msg: '微信认证失败'
        }
      }
    } else if (identity === 2) {
      let { username, password } = ctx.request.body
      // 系统管理员登录
      if (username) {
        if (password) {
          let user = await User.findOne({ username: username, identity: identity })
          if (user) {
            // 检查密码的合法性
            if (user.is_active) {
              user.checkPassword(password, (err, isCorrect) => {
                if (err) {
                  ctx.body = { ok: false, msg: '密码错误' }
                  return
                }
                if (isCorrect) {
                  // 产生token
                  let userToken = { userid: user._id, identity: identity }
                  //token签名 有效期为2小时
                  const token = jwt.sign(userToken, secret, {
                    expiresIn: '4h'
                  })
                  console.log('用户 ' + user._id + ' 于 ' + new Date().toDateString() + ' 登录后台管理系统')
                  ctx.body = {
                    ok: true,
                    msg: '登录成功',
                    token: token,
                    userinfo: {
                      username: user.username,
                      avatar: user.avatar
                    }
                  }
                } else {
                  ctx.body = { ok: false, msg: '密码错误' }
                }
              })
            } else {
              ctx.body = { ok: false, msg: '账号未激活，请联系管理员' }
            }
          } else {
            ctx.body = { ok: false, msg: '暂无此账户，请联系管理员' }
          }
        } else {
          ctx.body = {
            ok: false,
            msg: '缺乏password参数'
          }
        }
      } else {
        ctx.body = {
          ok: false,
          msg: '缺乏username参数'
        }
      }
    } else {
      ctx.body = {
        ok: false,
        msg: '缺少identity参数'
      }
    }
  })

  router.post('/api/user/registe', async (ctx, next) => {
    let { identity } = ctx.request.body
    if (identity === 'appuser') {
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
      if (wxdata.session_key && wxdata.openid) {
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
              fontSize: 32,
              fontFamily: '使用系统字体',
              bright: 1,
              mode: '默认' // 模式
            }
          },
          read_time: 0,
          create_time: new Date()
        })
        // 已注册，生成token并返回
        let userToken = {
          userid: user._id
        }
        const token = jwt.sign(userToken, secret, {
          expiresIn: '2h'
        }) //token签名 有效期为2小时
        // 初始化书架
        let booklist = await BookList.create({
          userid: user.id,
          books: []
        })
        console.log('用户 ' + user._id + ' 于 ' + user.create_time.toDateString() + ' 注册, 并初始化书架')
        ctx.body = {
          ok: true,
          msg: '注册成功',
          token: token,
          userinfo: user,
          // 额外信息
          allbooks: []
        }
      } else {
        ctx.body = {
          ok: false,
          msg: '微信认证失败'
        }
      }
    } else if (identity === 'adminuser') {
      // 系统管理员注册
    } else {
      ctx.body = {
        ok: false,
        msg: '缺少identity参数'
      }
    }
  })

  /**
   * 获取用户书币数以及当日格言
   */
  router.get('/api/user/amount', async (ctx, next) => {
    let userid = await checkUserToken(ctx, next)
    if (userid) {
      let thisUser = await User.findById(userid)
      let arr = ['读万卷书,行万里路。 ——顾炎武', '读过一本好书，像交了一个益友。 ——臧克家', '鸟欲高飞先振翅，人求上进先读书', '书籍是人类思想的宝库', '书山有路勤为径，学海无涯苦作舟']
      let date = new Date()
      let day = date.getDate() % 5
      ctx.body = {
        ok: true,
        msg: '获取用户书币数以及当日格言成功',
        data: {
          text: arr[day],
          amount: thisUser.amount
        }
      }
    }
  })

  // 小程序获取个人设置
  router.get('/api/user/get_user_setting', async (ctx, next) => {
    let userid = await checkUserToken(ctx, next)
    if (userid) {
      let thisUser = await User.findById(userid)
      let result = {
        updateNotice: !!thisUser.setting.updateNotice,
        autoBuy: !!thisUser.setting.autoBuy,
        reader: {
          fontSize: thisUser.setting.reader.fontSize,
          fontFamily: thisUser.setting.reader.fontFamily,
          bright: thisUser.setting.reader.bright,
          mode: thisUser.setting.reader.mode // 模式
        }
      }
      ctx.body = {
        ok: true,
        msg: '获取个人信息成功',
        data: result
      }
    }
  })

  // 小程序更新个人设置
  router.put('/api/user/put_user_setting', async (ctx, next) => {
    let userid = await checkUserToken(ctx, next)
    if (userid) {
      let setting = ctx.request.body.setting
      if (setting) {
        let thisUser = await User.findById(userid, 'setting')
        if (thisUser) {
          const updateResult = await User.update({ _id: userid }, {
            $set: {
              setting: Object.assign(thisUser.setting, setting)
            }
          })
          if (updateResult.ok === 1) {
            ctx.body = { ok: true, msg: '更新设置成功'}
          } else {
            ctx.body = { ok: false, msg: '更新设置失败'}
          }
        } else {
          ctx.status = 401
          ctx.body = { ok: false, msg: '无效token', authfail: true }
        }
      } else {
        ctx.body = { ok: false, msg: '参数错误' }
      }
    }
  })

  // 后台获取用户列表
  router.get('/api/user/search', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'user_search')
    if (userid) {
      const keyword = ctx.request.query.keyword
      const users = await User.find({ username: new RegExp(keyword, 'i'), identity: 1 }, 'username')
      ctx.body = { ok: true, msg: '搜索用户成功', list: users }
    }
  })

  // 后台获取用户列表
  router.post('/api/user/addmount', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'user_search')
    if (userid) {
      let userid = ctx.request.body.userid
      let num = ctx.request.body.num
      num = parseInt(num)
      if (userid && num) {
        const result = await User.addAmount(userid, num, '充值书币')
        if (result) {
          ctx.body = { ok: true, msg: '充值书币成功' }
        } else {
          ctx.body = { ok: false, msg: '充值书币失败' }
        }
      } else {
        ctx.body = { ok: false, msg: '参数错误' }
      }
    }
  })
}
