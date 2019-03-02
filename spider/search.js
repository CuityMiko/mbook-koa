import request from 'superagent'
import requestProxy from 'superagent-proxy';
import userAgent from 'fake-useragent'
// superagent添加使用代理ip的插件
requestProxy(request);



async function doGetRequest(url) {
  console.log(userAgent())
  request
    .get('url')
    .set({ 'User-Agent': userAgent() })
    .timeout({ response: 5000, deadline: 60000 })
    .proxy(ip)
    .end(async (err, res) => {
      // 处理数据
    });
}

async function searchQianQianFaction(keyword='') {
  return new Promise((resolve, reject) => {

  })
}

async function searchThirdPartFaction(keyword='') {
  // 搜索千千小说网
  let result1 = searchQianQianFaction();
}

export { searchThirdPartFaction }
