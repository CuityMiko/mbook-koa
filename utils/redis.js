import Redis from 'ioredis'
import { REDIS_AUTH, REDIS_HOST, REDIS_PORT, REDIS_PASS } from '../config'

const redis = new Redis({
  port: REDIS_PORT, // Redis port
  host: REDIS_HOST, // Redis host
  family: 4, // 4 (IPv4) or 6 (IPv6)
  password: REDIS_AUTH ? REDIS_PASS : ''
})

export default redis
