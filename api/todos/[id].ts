// PATCH  /api/todos/:id  → 필드 수정({ set }) 또는 수정이력 추가({ pushHistory })
// DELETE /api/todos/:id  → 삭제
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getTodoModel } from '../_lib/db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query
  if (typeof id !== 'string') return res.status(400).json({ error: 'invalid id' })

  try {
    const Todo = await getTodoModel()

    if (req.method === 'PATCH') {
      const { set, pushHistory } = (req.body || {}) as {
        set?: Record<string, unknown>
        pushHistory?: unknown
      }
      const ops: Record<string, unknown> = {}
      if (set && typeof set === 'object') ops.$set = set
      if (pushHistory) ops.$push = { history: pushHistory }
      if (!ops.$set && !ops.$push) return res.status(400).json({ error: 'nothing to update' })

      const updated = await Todo.findByIdAndUpdate(id, ops, { new: true })
      if (!updated) return res.status(404).json({ error: 'not found' })
      return res.status(200).json(updated)
    }

    if (req.method === 'DELETE') {
      const del = await Todo.findByIdAndDelete(id)
      if (!del) return res.status(404).json({ error: 'not found' })
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'PATCH, DELETE')
    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
}
