import Redis from 'ioredis'
import config from '../config'

const redis = new Redis({
  port: config.redis_port, // Redis port
  host: config.redis_host, // Redis host
  family: 4, // 4 (IPv4) or 6 (IPv6)
  password: config.redis_auth ? config.redis_pass : ''
})

export default redis
