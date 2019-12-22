/**
 * 任何用户可以访问的接口，不管用户是否已经登录
 */
const everyBodyCanAccess = [
  'GET /',
  'OPTIONS *',
  'GET *.*',
  'GET /api/front/banner',
  'GET /api/front/theme',
  'POST /api/front/recommend',
  'GET /api/front/comments',
  'POST /api/front/user/login',
  'POST /api/front/user/registe',
  'GET /api/front/bookdetail',
  'POST /api/front/user/send_verify',
  'POST /api/front/user/check_verify',
  'GET /api/front/poster/book_preview',
  'GET /api/front/poster/book',
]

/**
 * 已认证用户可以访问的接口，用户必须已经登录
 */
const authenticatedAccess = [
  'GET /api/current_user',
  'GET /api/user',
  'GET /api/stat/real_time',
  'GET /api/stat/area',
  'GET /api/stat/phone_type',
  'GET /api/stat/click',
  'POST /api/user/change_password'
]

export { everyBodyCanAccess, authenticatedAccess }
