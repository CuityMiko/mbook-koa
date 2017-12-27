const config = {
	port: 5000,
	mongo_url: 'mongodb://localhost:27017/mbook',
	wx_appid: 'wxc7bb707dc3f735ed', // 小程序appid
	wx_secret: 'd2b60beed687a23c9ec56dc3d8374216', // 小程序秘钥
	mch_id: '1493983632', // 支付商户号
	partner_key: 'eysEem0uvwHw1y0gQt5D1XhldCW7b78t', // 微信商户平台API密钥
	pfx: '../config/weixin_pay_cert.p12', // 微信商户平台证书
	notify_url: 'http://127.0.0.1:5000/api/pay/notify' // 微信异步通知
}

module.exports = config
