import mongoose from 'mongoose'

const BannerSchema = new mongoose.Schema({
    filename: String,
    old_filename: String,
    filesize: Number,
    userid: mongoose.Schema.ObjectId, // 所属人
    tmp_url: String, // 腾讯云临时地址
    remote_url: String, // 七牛永久地址
    time: Date
})

BannerSchema.statics.test = async function () {
  
}

let Banner = mongoose.model('Banner', BannerSchema)

export { Banner }
