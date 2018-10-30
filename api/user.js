import jwt from 'jsonwebtoken'
import request from 'request'
import querystring from 'querystring'
import Promise from 'bluebird'
import config from '../config'
import moment from 'moment'
import shortid from 'shortid'
import { User, BookList, Pay, Share, Attendance, Award, Buy, Comment, FormId, Setting } from '../models'
import { checkUserToken, checkAdminToken, debug } from '../utils'

const secret = 'mbook' // token秘钥

function doRequest(url) {
  return new Promise((resolve, reject) => {
    request(url, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        resolve(JSON.parse(body))
      } else {
        debug('请求微信接口失败', { url, err: error })
        reject(error || body)
      }
    })
  })
}

function updateLastLoginTime(userid) {
  // 更新用户最近登录时间，并将登录次数加1
  User.update({ _id: userid }, { $set: { last_login_time: new Date() }, $inc: { login_times: 1 } }, function(err, res) {
    if (err) {
      debug('更新用户最近登录时间失败', { userid, err })
      return false
    }
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
          //token签名 有效期为4小时
          const token = jwt.sign(userToken, secret, {
            expiresIn: '4h'
          })
          console.log('用户 ' + user._id + ' 于 ' + user.create_time.toDateString() + ' 登录')
          updateLastLoginTime(user._id)
          const booklist = await BookList.findOne({ userid: user._id }, 'books')
          let allBooks = []
          if (booklist) {
            allBooks = booklist.books.map(item => {
              return item.bookid
            })
          }
          // 获取用户邀请信息
          // 查询当前用户的邀请信息，如果找不到则创建一个
          let hisShareInfo = await Share.findOne({ userid: user._id })
          if (!hisShareInfo) {
            const code = shortid.generate()
            hisShareInfo = await Share.create({
              userid: await Share.transId(user._id),
              code,
              award_records: [],
              share_records: [],
              accept_records: [],
              create_time: new Date()
            })
          }
          // 统计用户邀请信息，今日邀请人数，以及累计邀请人数，累计获得书书币数
          const nowDateStr = moment().format('YYYY/MM/DD')
          const startTime = new Date(nowDateStr + ' 00:00:00')
          const endTime = new Date(nowDateStr + ' 24:00:00')
          let todayInviteNum = 0
          let totalInviteNum = 0
          let todayAwardNum = 0
          let totalAwardNum = 0
          let users = []
          hisShareInfo.accept_records.forEach(item => {
            const time = item.accept_time.getTime()
            if (time >= startTime.getTime() && time <= endTime.getTime()) {
              todayInviteNum++
            }
            const uid = item.uid.toString()
            if (users.indexOf(uid) < 0) {
              users.push(uid)
              totalInviteNum++
            }
          })
          hisShareInfo.award_records.forEach(item => {
            const time = item.award_time.getTime()
            if (time >= startTime.getTime() && time <= endTime.getTime()) {
              todayAwardNum += item.amount
            }
            totalAwardNum += item.amount
          })
          // 获取设置中的分享设置
          const globalSetting = await Setting.getSetting('share|wxcode|index_dialog|charge_tips|secret_tips|shut_check|shut_charge_tips|fixed_button|friend_help_share')
          ctx.body = {
            ok: true,
            msg: '登录成功',
            token: token,
            userinfo: user,
            // 额外返回信息
            allbooks: allBooks,
            code: hisShareInfo.code,
            shareInfo: {
              todayAwardNum: 0,
              todayInviteNum: 0,
              totalAwardNum: 0,
              totalInviteNum: 0
            },
            award_records: hisShareInfo.award_records.map(item => {
              return {
                name: item.user || '--',
                type: item.name.replace('奖励', ''),
                time: moment(item.award_time).format('YYYY/MM/DD')
              }
            }),
            globalSetting
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
      if (!username) {
        debug('登录参数错误', { identity, username })
        ctx.body = {
          ok: false,
          msg: '缺乏username参数'
        }
        return false
      }

      if (!password) {
        debug('登录参数错误', { identity, username, password })
        ctx.body = {
          ok: false,
          msg: '缺乏password参数'
        }
        return false
      }

      let user = await User.findOne({ username: username, identity: identity })
      if (!user) {
        debug('管理员登录失败，账号错误', { identity, username, password })
        ctx.body = { ok: false, msg: '暂无此账户，请联系管理员' }
        return false
      }

      // 检查密码的合法性
      if (!user.is_active) {
        debug('管理员登录失败，账号未激活，请联系管理员', { identity, username, password })
        ctx.body = { ok: false, msg: '账号未激活，请联系管理员' }
        return false;
      }

      // 检测密码正确性
      user.checkPassword(password, (err, isCorrect) => {
        if (err) {
          debug('管理员登录失败，密码校验失败', { identity, username, password })
          ctx.body = { ok: false, msg: '密码错误' }
          return false;
        }
        if (isCorrect) {
          // 产生token
          let userToken = { userid: user._id, identity: identity }
          //token签名 有效期为2小时
          const token = jwt.sign(userToken, secret, {
            expiresIn: '4h'
          })
          debug('用户 ' + user._id + ' 于 ' + new Date().toDateString() + ' 登录后台管理系统', '')
          // 更新用户最近登录时间
          updateLastLoginTime(user._id)
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
          debug('管理员登录失败，密码错误', { identity, username, password })
          ctx.body = { ok: false, msg: '密码错误' }
        }
      })
    } else {
      debug('登录参数错误', { identity })
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
        let isUserExit = await User.findOne({ openid: wxdata.openid })
        if (!isUserExit) {
          let user = await User.create({
            username: nickName, // 用户名就使用昵称
            password: null,
            avatar: avatarUrl,
            identity: 1, // 区分用户是普通用户还是系统管理员
            openid: wxdata.openid, // 小程序openid
            amount: 0, //
            setting: {
              updateNotice: true,
              autoBuy: true,
              reader: {
                fontSize: 36,
                fontFamily: '使用系统字体',
                bright: 1,
                mode: '默认', // 模式,
                overPage: 1 // 翻页模式
              }
            },
            read_time: 0,
            create_time: new Date(),
            last_login_time: new Date(),
            login_times: 0
          })
          // 已注册，生成token并返回
          let userToken = {
            userid: user._id
          }
          const token = jwt.sign(userToken, secret, {
            expiresIn: '4h'
          }) //token签名 有效期为2小时
          // 初始化书架
          let booklist = await BookList.create({
            userid: user.id,
            books: []
          })
          console.log('用户 ' + user._id + ' 于 ' + user.create_time.toDateString() + ' 注册, 并初始化书架')
          updateLastLoginTime(user._id)
          // 创建分享记录
          const code = shortid.generate()
          let hisShareInfo = await Share.create({
            userid: await Share.transId(user._id),
            code,
            award_records: [],
            share_records: [],
            accept_records: [],
            create_time: new Date()
          })
          // 获取设置中的分享设置
          const globalSetting = await Setting.getSetting('share|wxcode|index_dialog|charge_tips|secret_tips|shut_check|shut_charge_tips|fixed_button|friend_help_share')
          ctx.body = {
            ok: true,
            msg: '注册成功',
            token: token,
            userinfo: user,
            // 额外信息
            allbooks: [],
            code: hisShareInfo.code,
            shareInfo: {
              todayAwardNum: 0,
              todayInviteNum: 0,
              totalAwardNum: 0,
              totalInviteNum: 0
            },
            award_records: [],
            globalSetting
          }
        } else {
          // 产生token
          let userToken = { userid: isUserExit._id }
          //token签名 有效期为2小时
          const token = jwt.sign(userToken, secret, {
            expiresIn: '4h'
          })
          console.log('用户 ' + isUserExit._id + ' 于 ' + new Date().toDateString() + ' 登录')
          // 更新用户最近登录时间
          updateLastLoginTime(isUserExit._id)
          const booklist = await BookList.findOne({ userid: isUserExit._id }, 'books')
          let allBooks = []
          if (booklist) {
            allBooks = booklist.books.map(item => {
              return item.bookid
            })
          }
          // 获取用户邀请信息
          // 查询当前用户的邀请信息，如果找不到则创建一个
          let hisShareInfo = await Share.findOne({ userid: isUserExit._id })
          if (!hisShareInfo) {
            const code = shortid.generate()
            hisShareInfo = await Share.create({
              userid: await Share.transId(isUserExit._id),
              code,
              award_records: [],
              share_records: [],
              accept_records: [],
              create_time: new Date()
            })
          }
          // 统计用户邀请信息，今日邀请人数，以及累计邀请人数，累计获得书书币数
          const nowDateStr = moment().format('YYYY/MM/DD')
          const startTime = new Date(nowDateStr + ' 00:00:00')
          const endTime = new Date(nowDateStr + ' 24:00:00')
          let todayInviteNum = 0
          let totalInviteNum = 0
          let todayAwardNum = 0
          let totalAwardNum = 0
          let users = []
          hisShareInfo.accept_records.forEach(item => {
            const time = item.accept_time.getTime()
            if (time >= startTime.getTime() && time <= endTime.getTime()) {
              todayInviteNum++
            }
            const uid = item.uid.toString()
            if (users.indexOf(uid) < 0) {
              users.push(uid)
              totalInviteNum++
            }
          })
          hisShareInfo.award_records.forEach(item => {
            const time = item.award_time.getTime()
            if (time >= startTime.getTime() && time <= endTime.getTime()) {
              todayAwardNum += item.amount
            }
            totalAwardNum += item.amount
          })
          // 获取设置中的分享设置
          const globalSetting = await Setting.getSetting('share|wxcode|index_dialog|charge_tips|secret_tips|shut_check|shut_charge_tips|fixed_button|friend_help_share')
          ctx.body = {
            ok: true,
            msg: '登录成功',
            token: token,
            userinfo: isUserExit,
            // 额外返回信息
            allbooks: allBooks,
            code: hisShareInfo.code,
            shareInfo: {
              todayAwardNum,
              todayInviteNum,
              totalAwardNum,
              totalInviteNum
            },
            award_records: hisShareInfo.award_records.map(item => {
              return {
                name: item.user || '--',
                type: item.name.replace('奖励', ''),
                time: moment(item.award_time).format('YYYY/MM/DD')
              }
            }),
            globalSetting
          }
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
          mode: thisUser.setting.reader.mode, // 模式
          overPage: thisUser.setting.reader.overPage || 0 // 翻页模式
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
          const updateResult = await User.update(
            { _id: userid },
            {
              $set: {
                setting: Object.assign(thisUser.setting, setting)
              }
            }
          )
          if (updateResult.ok === 1) {
            ctx.body = { ok: true, msg: '更新设置成功' }
          } else {
            ctx.body = { ok: false, msg: '更新设置失败' }
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

  // 后台手动充值书币
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

  // 后台用户管理--获取用户列表
  router.get('/api/user', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'user_list')
    if (userid) {
      let { page, limit, name, id } = ctx.request.query
      if (page) {
        page = parseInt(page)
      } else {
        page = 1
      }
      if (limit) {
        limit = parseInt(limit)
      } else {
        limit = 10
      }
      if (!name) {
        name = ''
      }
      if (!id) {
        id = ''
      }
      let total = 0
      let users = []
      if (id) {
        total = await User.count({ _id: id, username: new RegExp(name, 'i'), identity: 1 })
        users = await User.find({ _id: id, username: new RegExp(name, 'i'), identity: 1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .sort({ create_time: -1 })
      } else {
        total = await User.count({ username: new RegExp(name, 'i'), identity: 1 })
        users = await User.find({ username: new RegExp(name, 'i'), identity: 1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .sort({ create_time: -1 })
      }
      ctx.body = { ok: true, msg: '获取用户列表成功', list: users, total }
    }
  })

  // 后台更新用户信息
  router.put('/api/user/:id', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'user_update')
    if (userid) {
      let { amount } = ctx.request.body
      let id = ctx.params.id
      let result = await User.update(
        { _id: id },
        {
          $set: {
            amount: amount
          }
        }
      )
      if (result.ok === 1) {
        ctx.body = { ok: true, msg: '更新用户成功' }
      } else {
        ctx.body = { ok: false, msg: '更新用户失败' }
      }
    }
  })

  router.delete('/api/user/:id', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'user_delete')
    if (userid) {
      let id = ctx.params.id
      let chapter_id = ctx.params.chapter_id
      await Award.remove({ userid: id })
      await Comment.remove({ userid: id })
      await BookList.remove({ userid: id })
      await Pay.remove({ userid: id })
      await Share.remove({ userid: id })
      await Attendance.remove({ userid: id })
      await FormId.remove({ userid: id })
      await User.remove({ _id: id })
      ctx.body = { ok: true, msg: '删除用户成功' }
    }
  })
}
