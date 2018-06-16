import JsSHA from 'jssha'

const createNonceStr = () => {
  return Math.random().toString(36).substr(2, 15)
}

const createTimestamp = () => {
  const timestamp = parseInt(new Date().getTime() / 1000, 10)
  return String(timestamp)
}

const raw = (args) => {
  const keys = Object.keys(args).sort()
  const newArgs = {}
  keys.forEach((key) => {
    newArgs[key.toLowerCase()] = args[key]
  })

  let string = ''
  for (const key in newArgs) {
    if (newArgs.hasOwnProperty(key)) string += `&${key}=${newArgs[key]}`
  }
  string = string.substr(1)
  return string
}

const sign = (ticket, url) => {
  const ret = {
    jsapi_ticket: ticket,
    nonceStr: createNonceStr(),
    timestamp: createTimestamp(),
    url,
  }
  const string = raw(ret)
  let shaObj = new JsSHA("SHA-1", "TEXT");
  shaObj.update(string);
  ret.signature = shaObj.getHash("HEX");

  return ret
}

export default sign
