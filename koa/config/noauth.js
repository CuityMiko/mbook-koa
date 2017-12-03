// 记录哪些不需要登录即可访问的借口地址
const paths = [
  '/',
  '/api/banner/list',
  '/api/theme/index_list',
  '/api/theme/change_list',
  '/api/chapter/list',
  '/api/chapter/search',
  '/api/chapter/add',
  '/api/get_text',
  '/api/good',
  '/api/charge',
  '/api/good/list',
  '/api/user/login',
  '/api/user/registe'
]

let noAuthPathArr = []
paths.forEach(item => {
  noAuthPathArr.push(new RegExp(item))
})

module.exports = noAuthPathArr
