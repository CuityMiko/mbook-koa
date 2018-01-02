const config = {
	port: 5000,
	mongo_url: 'mongodb://localhost:27017/mbook',
	wx_appid: 'xxx', // 小程序appid
	wx_secret: 'xxx', // 小程序秘钥
	mch_id: 'xxx', // 支付商户号
	partner_key: 'xxx', // 微信商户平台API密钥
	pfx: '/xxx', // 微信商户平台证书
	notify_url: 'xxx' // 微信异步通知
}

module.exports = config
