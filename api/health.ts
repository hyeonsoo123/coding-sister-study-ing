// 진단용 엔드포인트 (mongoose 미사용) — 환경변수/런타임 확인
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    hasMongoUri: !!process.env.MONGODB_URI,
    node: process.version,
  })
}
