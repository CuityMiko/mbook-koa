import request from 'superagent'
import requestProxy from 'superagent-proxy';
import userAgent from 'fake-useragent'
// superagent添加使用代理ip的插件
requestProxy(request);



async function doGetRequest(url) {
  console.log(userAgent())
  request
    .get('http://www.77xsw.la/')
    .set({ 'User-Agent': userAgent() })
    .timeout({ response: 5000, deadline: 60000 })
    .proxy('111.177.190.31:9999')
    .end(async (err, res) => {
			console.log('TCL: doGetRequest -> err, res', err, res)
      // 处理数据
    });
}

async function searchQianQianFaction(keyword='') {
  return new Promise((resolve, reject) => {
    await doGetRequest()
  })
}

async function searchThirdPartFaction(keyword='') {
  // 搜索千千小说网
  let result1 = await doGetRequest();
	console.log('TCL: searchThirdPartFaction -> result1', result1)
}

export { searchThirdPartFaction }
