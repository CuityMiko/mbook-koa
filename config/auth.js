/**
 * 任何用户可以访问的接口，不管用户是否已经登录
 */
const everyBodyCanAccess = [
  'GET /',
  'GET /code_diff',
  'OPTIONS *',
  'POST /api/front/user/login',
  'POST /api/front/user/registe',
  'POST /api/user/set_password',
  'POST /api/user/send_reset_email',
  'GET /api/user/check_account',
  'GET /api/page/:id',
  'GET /page/:aid/:pid', // 页面访问/page/activityId/pageId'
  'GET /test-template',
  'GET /api/stat',
  'GET /api/front/comment/list',
  'POST /api/front/recommend',
  'PUT /api/comment/like',
  'POST /api/comment',
  'POST /api/other/upload-save-image',
  'POST /api/other/upload-base64-image',
  'POST /api/form',
  'GET /api/proxy/judge_is_kaihu',
  'GET /api/other/get-service-time',
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
