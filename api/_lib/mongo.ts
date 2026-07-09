// ============================================================
//  MongoDB 연결 전용 모듈 (Vercel 서버리스 함수 공용)
//  mongoose 를 최상단이 아닌 함수 안에서 지연 import 한다.
//  → 번들/로드 오류도 핸들러 try/catch 로 잡아 JSON 으로 노출 가능,
//    서버리스 인스턴스 재사용 시 커넥션을 전역 캐싱해 재활용.
//  모델 정의는 각 모델 파일(db.ts, userModel.ts)이 담당한다.
// ============================================================
import type mongoose from 'mongoose'

type Mongoose = typeof mongoose

const g = globalThis as unknown as {
  _mongoConn?: Promise<unknown>
}

// 연결 완료된 mongoose 인스턴스 반환. 로드/연결 오류는 여기서 throw → 핸들러가 잡음.
export async function connectMongo(): Promise<Mongoose> {
  const m = (await import('mongoose')).default
  if (!g._mongoConn) {
    const uri = process.env.MONGODB_URI
    if (!uri) throw new Error('MONGODB_URI 환경변수가 설정되지 않았습니다.')
    g._mongoConn = m.connect(uri)
  }
  await g._mongoConn
  return m
}
