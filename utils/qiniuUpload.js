import qn from 'qn'
import config from '../config'

// qiniu上传设置
const client = qn.create({
  accessKey: config.accessKey,
  secretKey: config.secretKey,
  bucket: 'upload',
  origin: 'https://fs.andylistudio.com',
})

export default function qiniuUpload(buffer, key) {
  return new Promise((resolve, reject) => {
    client.upload(buffer, { key }, function(err, result) {
      if (err) {
        console.log(err)
        reject(err)
        return
      }
      resolve(result.url)
    })
  })
}
