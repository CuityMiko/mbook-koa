import axios from 'axios'
import qs from 'qs'
import Cookies from "js-cookie";
import {Message} from 'iview'
import { router } from '../router/index';
import store from '../store';
import env from '../../build/env';

axios.defaults.baseURL = env === 'development'
  ? 'http://127.0.0.1:5000'
  : env === 'production'
    ? 'https://mbook.lilyplay.com'
    : 'https://mdebug.lilyplay.com'

// 这里的config包含每次请求的内容
axios.interceptors.request.use(config => {
  // 判断localStorage中是否存在admin_token
  if (Cookies.get('admin_token')) {
    //  存在将admin_token写入 request header
    config.headers.Authorization = `Bearer ${Cookies.get('admin_token')}`
  }
  return config
}, err => {
  return Promise.reject(err)
})

axios.interceptors.response.use(response => {
  return response
}, error => {
  return Promise.resolve(error.response)
})

function checkStatus (response) {
  // 如果http状态码正常，则直接返回数据
  if (response && (response.status === 200 || response.status === 304 ||
    response.status === 400 || response.status === 401 || response.status === 403 || response.status === 404 || response.status === 500)) {
    return response
  }
  // 异常状态(状态值不是以上的情况)下，把错误信息返回去
  return {
    ok: false,
    msg: '网络异常'
  }
}

function checkCode (res, des) {
  // 如果code异常(这里已经包括网络错误，服务器错误，后端抛出的错误)，可以弹出一个错误提示，告诉用户
  if (res.status === 404) {
    Message.error(des + '失败')
    return
  }
  // token过期错误
  if (res.status === 401) {
    Message.error('登录状态过期，请退出重新登录')
    store.commit("logout", this);
    store.commit("clearOpenedSubmenu");
    router.push({name: "login"})
    return
  }
  if (res.status === 403) {
    Message.error('您暂无此权限')
  }
  if (res.data && (!res.data.ok)) {
    if (res.data.msg) {
      Message.error(des + '失败，' + res.data.msg)
    } else {
      Message.error(des + '失败')
    }
  }
  return res
}
// 请求方式的配置
export default {
  //  post
  post (url, data, des) {
    return axios({
      method: 'post',
      url: url,
      data: qs.stringify(data),
      timeout: 5000,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      }
    }).then((response) => {
      return checkStatus(response, des)
    }).then((response) => {
      return checkCode(response, des)
    })
  },
  // get
  get (url, params, des) {
    return axios({
      method: 'get',
      url,
      params,
      timeout: 5000,
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    }).then((response) => {
      return checkStatus(response, des)
    }).then((response) => {
      return checkCode(response, des)
    })
  },
  patch (url, params, des) {
    return axios({
      method: 'patch',
      url,
      data: params,
      timeout: 5000,
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    }).then((response) => {
      return checkStatus(response, des)
    }).then((response) => {
      return checkCode(response, des)
    })
  },
  delete (url, params, des) {
    return axios({
      method: 'delete',
      url,
      data: params,
      timeout: 5000,
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    }).then((response) => {
      return checkStatus(response, des)
    }).then((response) => {
      return checkCode(response, des)
    })
  }
}
