import qn from 'qn'
import { QINIU_ACCESS_KEY, QINIU_SECRET_KEY, QINIU_BUCKET, QINIU_CDN_DOMAIN, QINIU_IS_USE_HTTPS } from '../config'

// qiniu上传设置
const client = qn.create({
  accessKey: QINIU_ACCESS_KEY,
  secretKey: QINIU_SECRET_KEY,
  bucket: QINIU_BUCKET,
  origin: QINIU_CDN_DOMAIN
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
