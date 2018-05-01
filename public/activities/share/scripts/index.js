function ready() {
  console.log('I am ready!')
  wx.miniProgram.postMessage({ data: {'msg': 'I am ready'} })
  // wx.miniProgram.navigateBack()
  wx.miniProgram.getEnv(function(res) {
	  console.log(res.miniprogram) // true
	})
}
if (!window.WeixinJSBridge || !WeixinJSBridge.invoke) {
  document.addEventListener('WeixinJSBridgeReady', ready, false)
} else {
  ready()
}