// 记录哪些不需要登录即可访问的借口地址
const paths = [
  '/api/banner/list',
  '/api/theme/index_list',
  '/api/theme/change_list',
  '/api/user/login',
  '/api/user/registe'
]

let noAuthPathArr = []
paths.forEach(item => {
  noAuthPathArr.push(new RegExp(item))
})

module.exports = noAuthPathArr
