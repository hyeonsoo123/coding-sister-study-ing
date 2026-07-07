// MongoDB 연결 테스트 스크립트 (mongoose 사용, ESM)
// 실행: npm run db:connect
import 'dotenv/config'
import dns from 'dns'
import mongoose from 'mongoose'

// 윈도우/일부 네트워크에서 mongodb+srv 의 SRV 조회가 막히는 문제 방지 (공용 DNS 사용)
dns.setServers(['8.8.8.8', '1.1.1.1'])

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/coding_sister_study'

try {
  const conn = await mongoose.connect(MONGODB_URI)
  console.log('✅ MongoDB 연결 성공!')
  console.log(`   Host    : ${conn.connection.host}`)
  console.log(`   DB Name : ${conn.connection.name}`)
  await mongoose.connection.close()
} catch (err) {
  console.error('❌ MongoDB 연결 실패:', err.message)
  process.exit(1)
}
