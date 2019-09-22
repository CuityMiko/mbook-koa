import mongoose from 'mongoose'

const AdvisementSchema = new mongoose.Schema(
  {
    show: Boolean, // 是否展示
    type: Number, // type为0表示跳转小程序地址，type为1表示跳转外部链接
    url: String, // 跳转链接
    img_url: String, // 图片地址
    des: String, // 描述
    create_time: Date // 创建时间
  },
  { versionKey: false }
)

let Advisement = mongoose.model('Advisement', AdvisementSchema)

export { Advisement }
