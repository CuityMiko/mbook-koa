import mongoose from 'mongoose'
import bcrypt from 'bcrypt-nodejs'
import { Award } from './award'
import { FormId } from './formid'
import { Setting } from './setting'
import { sendWxMessage } from '../utils/wxCode'
import { reportError } from '../utils'
const SALT_WORK_FACTOR = 10

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    password: String,
    avatar: String,
    identity: Number, // 区分用户是普通用户还是系统管理员，1：小程序用户，2：系统管理员
    openid: { type: String, unique: true }, // 小程序openid
    // unionid: String, // 小程序unionid
    amount: 0, // 书币数量
    setting: {
      updateNotice: Boolean,
      reader: {
        fontSize: Number,
        fontFamily: String,
        bright: Number,
        mode: String, // 模式
        overPage: 0 // 0表示左右翻页模式，1表示上下翻页模式
      },
      autoBuy: { type: Boolean, default: true } // 是否自动购买下一章
    },
    is_active: Boolean, // 后台管理账号是否激活标志
    permission: [], // 后台管理系统权限配置字段
    read_time: { type: Number, default: 0 },
    create_time: Date,
    last_login_time: Date, // 最近登录时间
    login_times: { type: Number, default: 0 } // 登录次数
  },
  { versionKey: false }
)

UserSchema.index({ openid: 1 }, { unique: true })

/**
 * 增加用户书币数的静态函数
 * @param {String} 用户id
 * @param {Number} 需要增加的阅币数
 */
UserSchema.statics.addAmount = async function(userid, num, des) {
  if (userid && num) {
    let current = await this.findById(userid)
    if (current) {
      let updateResult = await this.update({ _id: userid }, { $set: { amount: parseInt(current.amount + num) } })
      // 新奖励记录
      const awardLog = await Award.create({
        userid: await Award.transId(userid),
        des,
        amount: num,
        create_time: new Date()
      })
      if (updateResult.ok == 1 && updateResult.nModified == 1) {
        return true
      } else {
        console.log('发放书币时更新失败', { userid, num, err: updateResult })
        return false
      }
    } else {
      console.log('发放书币时找不到此用户', { userid, num })
      return false
    }
  } else {
    console.log('发放书币时参数错误', { userid, num })
    return false
  }
}

/**
 * 减少用户书币数的静态函数
 * @param {String} 用户id
 * @param {Number} 需要减少的阅币数
 */
UserSchema.statics.reduceAmount = async function(userid, num) {
  if (userid && num) {
    let current = await this.findById(userid)
    if (current) {
      let amount = parseInt(current.amount - num)
      if (amount >= 0) {
        let updateResult = await this.update({ _id: userid }, { $set: { amount: amount } })
        if (updateResult.ok == 1 && updateResult.nModified == 1) {
          return true
        } else {
          console.log('扣除书币时更新失败', { userid, num, err: updateResult })
          return false
        }
      } else {
        console.log('扣除书币时书币不足', { userid, num, amount: current.amount })
        return false
      }
    } else {
      console.log('扣除书币时用户不存在', { userid, num })
      return false
    }
  } else {
    console.log('扣除书币时参数错误', { userid, num })
    return false
  }
}

/**
 * 发送模板消息
 * @param userid {String} 用户id
 * @param type {String} 发送消息的类型，比如好友接受邀请的通知，或者书籍解锁成功的通知
 */
UserSchema.statics.sendMessage = async function(userid, type, data, extra) {
  return new Promise(async (resolve, reject) => {
    if (!(userid && type && data)) {
      console.log('发送模板消息时参数错误', JSON.stringify({ userid, type, data, extra }))
      reject({ ok: false, msg: '参数错误' })
      return false
    }
    let current = await this.findById(userid, 'openid')
    if (!current) {
      console.log('发送模板消息时找不到此用户', JSON.stringify({ userid, type, data, extra }))
      reject({ ok: false, msg: '用户不存在' })
      return false
    }
    if (type === 'accept') {
      // 检查是否打开了设置
      const setting = await Setting.findOne({ key: 'template_message_setting' }, 'value')
      if (!setting || !setting.value || JSON.parse(setting.value)['share'] !== 'true') {
        console.log('暂未打开好友邀请消息提示的设置')
        return false
      }
      // 查找user的formId
      const formid = await FormId.getFormId('share', userid)
      if (!formid) {
        // formId不存在
        console.log('发送模板消息时找不到此用户对应的formId', JSON.stringify({ userid, type, data, extra }))
        reject({ ok: false, msg: 'formId不存在' })
        return false
      }
      // 发送给邀请人的奖励模板消息
      sendWxMessage(current.openid, 'dzNZy9ArO1_JpwQ4cb994P-FikeIBHIoH0d4_gTcDXc', 'pages/loading/loading?goto=share', formid, data)
        .then(async res => {
          if (res.errcode === 0) {
            await FormId.updateFormId(userid, formid)
            resolve({ ok: true, msg: '发送模板消息成功' })
          } else {
            reportError('发送邀请奖励模板消息失败', {
              extra: {
                res,
                params: {}
              }
            })
            reject({ ok: false, msg: res.errmsg })
          }
        })
        .catch(err => {
          reject({ ok: false, msg: '发送模板消息失败', err })
        })
    } else if (type === 'secret') {
      // 秘钥解锁成功消息通知
      const setting = await Setting.findOne({ key: 'template_message_setting' }, 'value')
      if (!setting || !setting.value || JSON.parse(setting.value)['secret'] !== 'true') {
        console.log('暂未打开秘钥解锁消息提示的设置')
        return false
      }
      // 查找user的formId
      const formid = await FormId.getFormId('secret', userid)
      if (!formid) {
        // formId不存在
        console.log('发送模板消息时找不到此用户对应的formId', JSON.stringify({ userid, type, data, extra }))
        reject({ ok: false, msg: 'formId不存在' })
        return false
      }
      if (!extra.bookid) {
        console.log('发送秘钥解锁成功消息时bookid不存在', JSON.stringify({ userid, type, data, extra }))
        reject({ ok: false, msg: '发送秘钥解锁成功消息时bookid不存在', err })
        return false
      }
      sendWxMessage(current.openid, '94Oee2UU-xv0FmAAW1Pc1HRsivBFUdth9cV4CWMAiac', 'pages/loading/loading?bookid=' + extra.bookid, formid, data)
        .then(async res => {
          if (res.errcode === 0) {
            await FormId.updateFormId(userid, formid)
            resolve({ ok: true, msg: '发送模板消息成功' })
          } else {
            reportError('发送秘钥解锁模板消息失败', {
              extra: {
                res,
                params: {}
              }
            })
            reject({ ok: false, msg: res.errmsg })
          }
        })
        .catch(err => {
          reject({ ok: false, msg: '发送模板消息失败', err })
        })
    } else if (type === 'book-update') {
      // 书籍更新成功消息通知
      if (!extra.bookid) {
        console.log('发送书籍更新模板消息时bookid不存在', JSON.stringify({ userid, type, data, extra }))
        reject({ ok: false, msg: '发送书籍更新模板消息时bookid不存在', err })
        return false
      }
      // 查找user的formId
      const formid = await FormId.getFormId('read', userid, extra.bookid)
      if (!formid) {
        // formId不存在
        console.log('发送模板消息时找不到此用户对应的formId', JSON.stringify({ userid, type, data, extra }))
        reject({ ok: false, msg: 'formId不存在' })
        return false
      }
      sendWxMessage(current.openid, '66RVt2pXdkIQG3zFp6EyJsG8BAh4SrKhEnUaJ6Gi3hQ', 'pages/loading/loading?bookid=' + extra.bookid, formid, data)
        .then(async res => {
          if (res.errcode === 0) {
            await FormId.updateFormId(userid, formid)
            resolve({ ok: true, msg: '发送模板消息成功' })
          } else {
            reportError('发送书籍更新模板消息失败', {
              extra: {
                res,
                params: {}
              }
            })
            reject({ ok: false, msg: res.errmsg })
          }
        })
        .catch(err => {
          reject({ ok: false, msg: '发送模板消息失败', err })
        })
    }  else if (type === 'comment') {
      // 评论回复消息提示
      if (!extra.bookid) {
        console.log('发送书评模板消息时bookid不存在', JSON.stringify({ userid, type, data, extra }))
        reject({ ok: false, msg: '发送书评模板消息时bookid不存在', err })
        return false
      }
      // 查找user的formId
      const formid = await FormId.getFormId('comment', userid, extra.bookid)
      if (!formid) {
        // formId不存在
        console.log('发送模板消息时找不到此用户对应的formId', JSON.stringify({ userid, type, data, extra }))
        reject({ ok: false, msg: 'formId不存在' })
        return false
      }
      sendWxMessage(current.openid, 'JU9Bw6ogf-NGNm8hykXoZTYGjOFEp4X9juG54LEpSBY', 'pages/loading/loading?bookid=' + extra.bookid, formid, data)
        .then(async res => {
          if (res.errcode === 0) {
            await FormId.updateFormId(userid, formid)
            resolve({ ok: true, msg: '发送模板消息成功' })
          } else {
            reportError('发送书评模板消息失败', {
              extra: {
                res,
                params: {}
              }
            })
            reject({ ok: false, msg: res.errmsg })
          }
        })
        .catch(err => {
          reject({ ok: false, msg: '发送模板消息失败', err })
        })
    }
  })
}

// 存储密码之前将其转换成hash值
UserSchema.pre('save', function(next) {
  var user = this
  //产生密码hash当密码有更改的时候(或者是新密码)
  if (!user.isModified('password')) return next()
  // 产生一个salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    if (err) return next(err)
    /**
     * 结合salt产生新的hash
     * @param data — Data to be encrypted
     * @param salt — Salt to be used in encryption
     * @param progressCallback — Callback to be fired multiple times during the hash calculation to signify progress
     * @param callback — Callback with error and hashed result, to be fired once the data has been encrypted
     */
    bcrypt.hash(
      user.password,
      salt,
      function() {},
      function(err, hash) {
        if (err) return next(err)
        // 使用hash覆盖明文密码
        user.password = hash
        next()
      }
    )
  })
})

/**
 * 检验用户密码的合法性的实例方法
 */
UserSchema.methods.checkPassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err)
    cb(null, isMatch)
  })
}

let User = mongoose.model('User', UserSchema)

export { User }
