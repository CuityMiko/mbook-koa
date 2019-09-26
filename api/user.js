import jwt from 'jsonwebtoken'
import request from 'request'
import querystring from 'querystring'
import Promise from 'bluebird'
import { wxMiniprogramAppId, wxMiniprogramSecret, jwtSecret, fakeVertification } from '../config'
import shortid from 'shortid'
import moment from 'moment'
import crypto from 'crypto'
import Identicon from 'identicon.js'
import validator from 'validator'
import { User, BookList, Pay, Share, Attendance, Award, Comment, FormId, Setting, Notice } from '../models'
import { checkUserToken, checkAdminToken, reportError } from '../utils'
import redis from '../utils/redis'
import qiniuUpload from '../utils/qiniuUpload'

const createToken = (user, expiresIn) => {
  const { _id, identify } = user
  return jwt.sign({ userid: _id, identify }, jwtSecret, {
    expiresIn
  })
}

const formatUserOutput = user => {
  return {
    userid: user._id,
    username: user.username,
    mobile: user.mobile,
    avatar: user.avatar,
    identity: user.identity,
    amount: user.amount,
    last_login_time: user.last_login_time
  }
}

const defautUserTemplate = (data) => {
  return {
    username: '', // 用户名就使用昵称
    password: '',
    avatar: '',
    mobile: '', // 手机号码
    identify: 1, // 区分用户是普通用户还是系统管理员
    openid: '', // 小程序openid
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
    login_times: 0,
    ...data
  }
}

/**
 * 发送GET请求
 * @param {*} url 请求接口地址
 */
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

/**
 * 更新用户登录时间和登录次数
 * @param {*} userid 用户ID
 */
function updateLastLoginTime(userid) {
  // 更新用户最近登录时间，并将登录次数加1
  User.update({ _id: userid }, { $set: { last_login_time: new Date() }, $inc: { login_times: 1 } }, function(err, res) {
    if (err) {
      reportError(`更新用户最近登录时间失败`, err, {
        priority: '高',
        category: '错误',
        extra: { userid }
      })
      return false
    }
  })
}

/**
 * 初始化用户书架
 * @param {*} userid 用户ID
 */
function initUserBooklist(userid) {
  BookList.create({
    userid: userid,
    books: []
  })
    .then(res => {
      console.log(`初始化用户${userid}书架成功`)
    })
    .catch(err => {
      reportError('初始化用户书架失败', err, {
        priority: '高',
        category: '错误',
        extra: { userid }
      })
    })
}

async function getGlobalSetting() {
  let items = ['share', 'wxcode', 'index_dialog', 'charge_tips', 'secret_tips', 'shut_charge_tips', 'fixed_button', 'friend_help_share', 'share_white_list']
  return await await Setting.getSetting(items.join('|'))
}

export default function(router) {
  /**
   * 小程序端获取app设置信息
   * @method get
   */
  router.get('/api/front/user/setting', async (ctx, next) => {
    let userid = await checkUserToken(ctx, next)
    if (userid) {
      // 查询当前用户的邀请信息，如果找不到则创建一个
      let hisShareInfo = await Share.findOne({ userid })
      if (!hisShareInfo) {
        const code = shortid.generate()
        hisShareInfo = await Share.create({
          userid: await Share.transId(userid),
          code,
          award_records: [],
          accept_records: [],
          create_time: new Date()
        })
      }

      // 获取最近7天通知数量
      const startDate = new Date(moment().subtract(14, 'days'))
      const endDate = new Date()
      const orParams = []
      orParams.push({ user: { $regex: `.*${userid}.*` } })
      orParams.push({ user: 'all' })
      const userAgent = ctx.request.headers['user-agent']
      if (/Android/i.test(userAgent)) {
        orParams.push({ user: 'android' })
      }
      if (/iPhone|iPad|iPod/i.test(userAgent)) {
        orParams.push({ user: 'ios' })
      }
      const notices = await Notice.find({ $or: orParams, create_time: { $gt: startDate, $lt: endDate } }, '_id')

      // 获取设置中的分享设置
      const globalSetting = await getGlobalSetting()
      const inShareWhiteList = globalSetting.share_white_list.indexOf(userid) > -1
      ctx.body = { ok: true, msg: '获取app设置成功', data: { share: hisShareInfo, share_white_list: inShareWhiteList, setting: globalSetting }, notices: notices.map(item => item._id) }
    }
  })

  /**
   * 小程序端登录
   * @method post
   * @parmas code 微信临时登录凭证
   */
  router.post('/api/front/user/login', async (ctx, next) => {
    const { wey } = ctx.request.body
    // 小程序登录
    if (wey === 'miniprogram') {
      // app用户登录
      const { code } = ctx.request.body

      // 向微信服务器发送请求，使用code换取openid和session_key
      const qsdata = {
        grant_type: 'authorization_code',
        appid: wxMiniprogramAppId,
        secret: wxMiniprogramSecret,
        js_code: code
      }
      const wxdata = await doRequest('https://api.weixin.qq.com/sns/jscode2session?' + querystring.stringify(qsdata))
      if (!wxdata || !wxdata.session_key || !wxdata.openid) {
        ctx.body = { ok: false, msg: '微信认证失败' }
        return
      }

      // 检查用户是否已经存在
      const user = await User.findOne({ openid: wxdata.openid })
      if (!user) {
        ctx.body = { ok: false, msg: '尚未注册', token: null, registe: false }
        return
      }

      // 已注册，生成token并返回
      const token = await createToken(user, '1d')

      // 更新用户最近登录时间
      console.log('用户 ' + user._id + ' 于 ' + user.create_time.toDateString() + ' 登录')
      updateLastLoginTime(user._id)

      ctx.body = {
        ok: true,
        msg: '登录成功',
        token: token,
        userinfo: formatUserOutput(user)
      }
    } else if (wey === 'mobile+password') {
      const { mobile, password } = ctx.request.body
      // 验证参数
      const mobileReg = /^(13|15|17|18|14)[0-9]{9}$/
      if (!mobile || !mobileReg.test(mobile)) {
        ctx.body = { code: -1, msg: '手机号码格式错误' }
        return
      }
      if (!password || !validator.isLength(password, { min: 7, max: 42 })) {
        ctx.body = { code: -1, error: { password: '密码格式错误' } }
        return
      }
      // 查找数据库中是否存在指定邮箱和密码的记录
      const user = await User.findOne({ mobile, identify: { $ne: 2 } })
      if (!user) {
        ctx.body = { code: -1, error: { mobile: '手机号码尚未注册' } }
        return
      }
      // 校验密码
      const isPasswordValid = await user.validatePassword(password)
      if (!isPasswordValid) {
        ctx.body = { code: -1, error: { password: '密码错误' } }
        return
      }

      // 验证完毕，生成token
      const token = await createToken(user, '1d')
      ctx.body = {
        ok: true,
        msg: '登录成功',
        token: token,
        userinfo: formatUserOutput(user)
      }
    } else if (wey === 'mobile+verification') {
      const { mobile, verification } = ctx.request.body
      // 手机号码是否注册过
      const user = await User.findOne({ mobile, identify: { $ne: 2 } })
      if (!user) {
        ctx.body = { code: -1, msg: '手机号码尚未注册' }
        return
      }
      // 验证码是否正确
      const verifyInRedis = await redis.get(`phone_verify_${mobile}`)
      if (!verifyInRedis) {
        ctx.body = { code: -2, msg: '请先获取验证码' }
        return
      }
      if (verifyInRedis && verifyInRedis !== verification) {
        ctx.body = { code: -2, msg: '验证码错误' }
        return
      }
      // 验证完毕，生成token
      const token = await createToken(user, JWT_SECRET, '1d')
      // 清除验证码记录
      redis.del(`phone_verify_${mobile}`)
      delete user.password
      ctx.body = { code: 0, token, user, msg: '登录成功' }
    } else {
      ctx.body = {
        ok: false,
        msg: '登录类型暂不支持'
      }
    }
  })

  /**
   * 发送验证码到用户手机
   * 需要参数 mobile 手机号码, usage 注册用户还是登录
   */
  router.post('/api/front/user/send_verify', async ctx => {
    const { mobile, usage } = ctx.request.body
    console.log(ctx.request.body)
    // 校验合法性
    const mobileReg = /^(13|15|17|18|14)[0-9]{9}$/
    if (!mobile || !mobileReg.test(mobile)) {
      ctx.body = { code: -1, msg: '手机号码格式错误' }
      return
    }
    if (usage === 'login') {
      const user = await User.findOne({ mobile, identify: { $ne: 2 } })
      if (!user) {
        ctx.body = { code: -2, msg: '此号码尚未注册' }
        return
      }
    } else if (usage === 'registe') {
      const user = await User.findOne({ mobile, identify: { $ne: 2 } })
      if (user) {
        ctx.body = { code: -2, msg: '此号码已经被注册过了，请前往登录' }
        return
      }
    } else {
      ctx.body = { code: -1, msg: '请指明验证码用途' }
      return
    }

    // 查询当前redis是已经存在这个手机的验证码
    const verifyInRedis = await redis.get(`phone_verify_${mobile}`)
    if (verifyInRedis) {
      ctx.body = { code: -1, msg: '你请求太过频繁，请稍后再试' }
      return
    }

    // 开始发送短信
    const code = Math.random()
      .toString()
      .slice(-6)
    // 跳过短信验证，默认验证码666666
    if (fakeVertification) {
      console.log(`发送给手机 ${mobile} 验证码: 666666`)
      redis.set(`phone_verify_${mobile}`, 666666, 'EX', 60)
      ctx.body = { code: 0, msg: '发送短信验证码成功' }
    } else {
      const sendResult = await sendMessage('loginOrRegiste', mobile, { '#app#': '钱贷大师', '#code#': code })
      if (sendResult && sendResult.success) {
        redis.set(`phone_verify_${mobile}`, code, 'EX', 60)
        ctx.body = { code: 0, msg: '发送短信验证码成功' }
      } else {
        ctx.body = { code: -3, msg: sendResult ? sendResult.message : '发送短信验证码失败' }
      }
    }
  })

  /**
   * 用户注册
   * @method post
   * @parmas code 微信临时登录凭证
   * @parmas username 昵称
   * @parmas avatar 头像
   */
  router.post('/api/front/user/registe', async ctx => {
    const { wey } = ctx.request.body
    if (wey === 'miniprogram') {
      // 使用微信小程序注册
      const { code, username, avatar } = ctx.request.body
      // 向微信服务器发送请求，使用code换取openid和session_key
      const content = querystring.stringify({
        grant_type: 'authorization_code',
        appid: wxMiniprogramAppId,
        secret: wxMiniprogramSecret,
        js_code: code
      })
      const wxdata = await doRequest('https://api.weixin.qq.com/sns/jscode2session?' + content)
      if (!wxdata || !wxdata.session_key || !wxdata.openid) {
        ctx.body = { ok: false, msg: '微信认证失败' }
        return
      }

      // 检查用户是否已经存在
      const isUserExited = await User.findOne({ openid: wxdata.openid })
      if (isUserExited) {
        ctx.body = { ok: false, msg: '用户在小程序上已注册' }
        return
      }

      // 创建用户
      const newUser = await User.create(defautUserTemplate({
        username,
        avatar,
        openid: wxdata.openid, // 小程序openid
        identity: 1, // 区分用户是普通用户还是系统管理员
      }) {
        username, // 用户名就使用昵称
        password: null,
        avatar,
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

      // 生成token签名 有效期为一天
      const token = createToken(newUser, '1d')

      // 初始化书架
      initUserBooklist(newUser._id)
      console.log('Info', `用户 ${newUser._id} 于 ${newUser.create_time.toDateString()} 注册, 并初始化书架`)
      // 更新最近登录时间
      updateLastLoginTime(newUser._id)

      ctx.body = {
        ok: true,
        msg: '注册成功',
        token: token,
        userinfo: formatUserOutput(newUser)
      }
    } else if (wey === 'weixin') {
      // 使用微信注册
    } else if (wey === 'mobile') {
      // 使用手机号码注册
      const { password, mobile, verification } = ctx.request.body
      let error = {}
      const mobileReg = /^(13|15|17|18|14)[0-9]{9}$/
      const mobileVerifyReg = /^\d{6}$/
      if (!password || !validator.isLength(password, { min: 6, max: 40 })) error.password = '请输入6到16位的有效密码'

      if (!mobile || !mobileReg.test(mobile)) error.mobile = '请输入正确手机号码'
      if (!verification || !mobileVerifyReg.test(verification)) error.verification = '手机验证码格式错误'
      if (await User.isRepeat('mobile', mobile)) error.mobile = '手机号码已经被注册'

      const verifyInRedis = await redis.get(`phone_verify_${mobile}`)
      if (!verifyInRedis) error.verification = '请先获取验证码'
      if (verifyInRedis && verifyInRedis !== verification) error.verification = '验证码错误'

      // 验证是否出错
      if (JSON.stringify(error) !== '{}') {
        ctx.body = { ok: false, error }
        return
      }

      // 默认生成hash头像
      const username = 'u' + mobile // 用户名默认使用u+手机号的格式
      const hash = crypto.createHash('md5')
      hash.update(username) // 传入用户名
      const imgData = new Identicon(hash.digest('hex')).toString()
      const avatarBuffer = Buffer.from(imgData, 'base64')
      const avatarKey = `mbook/avatar/${username}.png`
      try {
        const avatar = await qiniuUpload(avatarBuffer, avatarKey)
        const newUser = await User.create({
          username, // 用户名就使用昵称
          password,
          avatar,
          mobile,
          identify: 1, // 区分用户是普通用户还是系统管理员
          openid: null, // 小程序openid
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

        if (newUser && newUser.id) {
          // 生成token
          delete newUser.password
          const token = createToken(newUser, '1d')
          ctx.body = {
            code: 0,
            msg: `用户注册成功`,
            token,
            userInfo: formatUserOutput(newUser)
          }
        } else {
          ctx.body = { code: -2, msg: `用户注册失败` }
        }
      } catch (err) {
        ctx.body = { code: -1, msg: '注册失败，' + err.toString() }
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
  router.get('/api/front/user/get_user_setting', async (ctx, next) => {
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
  router.put('/api/front/user/put_user_setting', async (ctx, next) => {
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
  router.get('/api/admin/user/search', async (ctx, next) => {
    let userid = await checkAdminToken(ctx, next, 'user_search')
    if (userid) {
      const keyword = ctx.request.query.keyword
      const users = await User.find({ $or: [{ username: new RegExp(keyword, 'i') }, { id: keyword }], identity: 1 }, 'username')
      ctx.body = { ok: true, msg: '搜索用户成功', list: users }
    }
  })

  // 后台手动充值书币
  router.post('/api/admin/user/addmount', async (ctx, next) => {
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
  router.get('/api/admin/user', async (ctx, next) => {
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
  router.put('/api/admin/user/:id', async (ctx, next) => {
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

  router.delete('/api/admin/user/:id', async (ctx, next) => {
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
