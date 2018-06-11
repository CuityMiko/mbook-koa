let Wechat = require('node-wechat-sign')
console.log(Wechat)
// const wechat = new Wechat({
//   "appid": "wxf6bb72d0ef5ea6ad",
//   "secret": "fc0833dc1551cf9ca90ba22ed9b95161",
//   "tokenApiTemplate": "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=#{appid}&secret=#{secret}",
//   "ticketApiTemplate": "https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=#{access_token}&type=jsapi"
// })  // You should instantiate it out of your method if you need to share the cache among methods
// (async function() {
//   const access_token = await wechat.getAccessToken()
//   const jsapi_ticket = await wechat.getTicket()
//   const signature = await wechat.sign(url)
//   console.log(signature)
// })()
