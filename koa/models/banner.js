import mongoose from 'mongoose'

const BannerSchema = new mongoose.Schema({
    priority: Number, // 展示的优先级
    show: Boolean, // 是否展示
    type: Number, // type为0表示跳转小程序地址，type为1表示跳转外部链接
    url: String, // 跳转链接
    img_url: String, // 图片地址
    des: String, // 描述
    create_time: Date // 创建时间
}, { versionKey: false })

/**
 * 获取需要展示的banner的静态函数
 * 按照优先级排序，并选取前三
 */
BannerSchema.statics.getBanner = async function () {
  return await this.find({ show: true }, 'type url img_url des').sort({priority: 1}).limit(3)
}

let Banner = mongoose.model('Banner', BannerSchema)

export { Banner }
