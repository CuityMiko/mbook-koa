import { User, FormId } from '../models'

FormId.create({
  userid: '5b17b93b85054c0523685202',
  formid: (new Date()).getTime(),
  create_time: new Date()
})

User.sendMessage('5b17b93b85054c0523685202', 'accept', {
  keyword1: {
    value: '测试用户1'
  },
  keyword2: {
    value: '您的好友--测试用户1已经接受您的阅读邀请，您获得15书币'
  },
  keyword3: {
    value: '2018-06-20 21:59:00'
  }
})
  .then(res => {
    if (res.ok) {
      console.log('message was send successfully!')
    } else {
      console.log(res.msg)
    }
  })
  .catch(err => {
    console.log(err)
    console.log('message was send failed!')
  })
