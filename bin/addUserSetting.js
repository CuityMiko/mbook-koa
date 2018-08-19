import { User } from '../models'
// 将用户设置全量更新为左右翻页
async function addUserSetting() {
  console.log('开始更新用户设置')
  let result = await User.updateMany({username: new RegExp('')}, {$set: {'setting.reader.overPage': 0}})
  console.log(result)
}

export default addUserSetting
