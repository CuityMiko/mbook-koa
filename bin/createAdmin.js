import { User } from '../models'
async function createAdmin() {
  console.log('开始创建管理员')
  User.create(
    {
      username: 'mbookLidikang',
      avatar: 'https://wx.qlogo.cn/mmopen/vi_32/SWkKED0AiblN0sGZT4zBUXxncnZ3fslHDcNDzIdv8bc8ibmfmGjEbyvnUgLOUggNs0fgF2RSNAicm4CpK5o7kDJXQ/0',
      identity: 2,
      create_time: new Date(),
      last_login_time: new Date('1997-01-01'),
      login_times: 0,
      is_active: true,
      password: 'lidikangMbook123',
      permission: []
    },
    function(err, res) {
      console.log(err, res)
    }
  )
}

export default createAdmin
