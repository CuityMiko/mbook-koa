import { User } from '../models'
async function createAdmin() {
  let user = User.create({
    "username": "mbookLidikang",
    "avatar": "https://wx.qlogo.cn/mmopen/vi_32/SWkKED0AiblN0sGZT4zBUXxncnZ3fslHDcNDzIdv8bc8ibmfmGjEbyvnUgLOUggNs0fgF2RSNAicm4CpK5o7kDJXQ/0",
    "identity": 2,
    "create_time": {
        "$date": "2017-11-20T13:08:14.970Z"
    },
    "is_active": true,
    "password": "$2a$10$rWikhREFsQSXMw4DvOiHzec0dRW.0nE07c79RlmAJICNX1rAoP6P.",
    "permission": []
  })
}

export default createAdmin
