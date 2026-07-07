// GET  /api/todos  → 전체 목록 (최신순)
// POST /api/todos  → 새 일정 생성
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { dbConnect, Todo } from '../../server/db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await dbConnect()

    if (req.method === 'GET') {
      const list = await Todo.find().sort({ _id: -1 })
      return res.status(200).json(list)
    }

    if (req.method === 'POST') {
      const created = await Todo.create(req.body)
      return res.status(201).json(created)
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
}
