
import jwt from 'jsonwebtoken'
console.log(jwt.sign({ userid: '5b852fc00bc7fa0ce5c4b5e4' }, secret, { expiresIn: '10h' }))
