import mongoose from 'mongoose'
import bcrypt from 'bcrypt-nodejs'
import { Award } from './award'
import { FormId } from './formid'
import { sendWxMessage } from '../utils/wxCode'
import { debug } from '../utils'
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
        debug('发放书币时更新失败', { userid, num, err: updateResult })
        return false
      }
    } else {
      debug('发放书币时找不到此用户', { userid, num })
      return false
    }
  } else {
    debug('发放书币时参数错误', { userid, num })
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
          debug('扣除书币时更新失败', { userid, num, err: updateResult })
          return false
        }
      } else {
        debug('扣除书币时书币不足', { userid, num, amount: current.amount })
        return false
      }
    } else {
      debug('扣除书币时用户不存在', { userid, num })
      return false
    }
  } else {
    debug('扣除书币时参数错误', { userid, num })
    return false
  }
}

/**
 * 发送模板消息
 * @param userid {String} 用户id
 * @param type {String} 发送消息的类型，比如好友接受邀请的通知，或者书籍解锁成功的通知
 */
UserSchema.statics.sendMessage = async function(userid, type, data) {
  return new Promise(async (resolve, reject) => {
    if(!(userid && type && data)) {
      debug('发送模板消息时参数错误', { userid, type, data })
      reject({ ok: false, msg: '参数错误' })
      return false
    }
    let current = await this.findById(userid, 'openid')
    if(!current) {
      debug('发送模板消息时找不到此用户', { userid, type, data })
      reject({ ok: false, msg: '用户不存在' })
      return false;
    }
    // 查找user的formId
    const thisFormId = await FormId.findOne({ userid }, 'formid')
    if (!thisFormId) {
      // formId不存在
      debug('发送模板消息时找不到此用户对应的formId', { userid, type, data })
      reject({ ok: false, msg: 'formId不存在' })
    }
    if (type === 'accept') {
      sendWxMessage(current.openid, 'P3vzJen2UH4JA_YKxCP9qgoYEyipzKno5AMap8VIyT0', '/pages/activities/share/share', thisFormId.formid, data)
        .then(res => {
          if (res.errcode === 0) {
            resolve({ ok: true, msg: '发送模板消息成功' })
          } else {
            debug('发送模板消息失败', res)
            reject({ ok: false, msg: res.errmsg })
          }
        })
        .catch(err => {
          debug('发送模板消息失败', err)
          reject({ ok: false, msg: '发送模板消息失败', err })
        })
    } else if (type === 'secret') {
      // todo
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
