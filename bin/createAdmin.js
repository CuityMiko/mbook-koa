import { User } from '../models'
async function createAdmin() {
  console.log('开始创建管理员')
  User.create(
    {
      username: 'mbookLidikang',
      avatar: 'https://img.vim-cn.com/78/0c4e9ce5eda33bd90fec6174818b859c7d7928.jpg',
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
