// 진단용 엔드포인트
//  /api/health        → 환경변수/런타임/배포버전 확인 (mongoose 미사용)
//  /api/health?db=1   → 실제 Mongo 연결 시도 후 결과/에러 반환
import type { VercelRequest, VercelResponse } from '@vercel/node'

const VERSION = 'diag-2'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const base = {
    ok: true,
    version: VERSION,
    hasMongoUri: !!process.env.MONGODB_URI,
    node: process.version,
  }

  if (req.query.db !== '1') return res.status(200).json(base)

  // DB 연결까지 시험 — 진짜 에러 메시지를 노출
  try {
    const { getTodoModel } = await import('../server/db')
    const Todo = await getTodoModel()
    const count = await Todo.countDocuments()
    return res.status(200).json({ ...base, db: 'connected', todoCount: count })
  } catch (e) {
    return res.status(500).json({
      ...base,
      db: 'failed',
      error: (e as Error).message,
      name: (e as Error).name,
    })
  }
}
