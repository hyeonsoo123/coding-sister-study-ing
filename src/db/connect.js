// MongoDB 연결 스크립트 (mongoose 사용)
// 실행: node src/db/connect.js
require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');

// 윈도우/일부 네트워크에서 mongodb+srv 의 SRV 조회가 막히는 문제 방지 (공용 DNS 사용)
dns.setServers(['8.8.8.8', '1.1.1.1']);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/coding_sister_study';

async function connectDB() {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB 연결 성공!');
    console.log(`   Host    : ${conn.connection.host}`);
    console.log(`   Port    : ${conn.connection.port}`);
    console.log(`   DB Name : ${conn.connection.name}`);
  } catch (err) {
    console.error('❌ MongoDB 연결 실패:', err.message);
    process.exit(1);
  }
}

// 이 파일을 직접 실행했을 때 연결 후 종료
if (require.main === module) {
  connectDB().then(() => mongoose.connection.close());
}

module.exports = connectDB;
