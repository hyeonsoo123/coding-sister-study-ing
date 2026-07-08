import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import 'dotenv/config' // .env 의 MONGODB_URI 를 process.env 로 로드
import dns from 'node:dns'
import type { IncomingMessage, ServerResponse } from 'node:http'

// ============================================================
//  개발 전용 플러그인: Vite dev 서버가 /api/todos 를 직접 처리
//  배포(Vercel)에서는 api/ 서버리스 함수가 같은 역할을 하므로
//  이 플러그인은 dev(`vite`)에서만 동작한다(apply: 'serve').
//  ▶ 로컬 DB 연동이 필요 없을 땐 아래 plugins 배열에서 apiDev() 만 주석.
// ============================================================
function apiDev(): Plugin {
  let modelPromise: Promise<any> | null = null

  // 연결 + Todo 모델 (api/_lib/db.ts 와 동일 스키마). 최초 1회만 연결.
  async function getTodoModel() {
    const mongoose = (await import('mongoose')).default
    if (!modelPromise) {
      // 윈도우/일부 네트워크에서 mongodb+srv SRV 조회 실패 방지 (공용 DNS)
      dns.setServers(['8.8.8.8', '1.1.1.1'])
      const uri = process.env.MONGODB_URI
      if (!uri) throw new Error('MONGODB_URI 미설정 (.env 확인)')
      modelPromise = mongoose.connect(uri).then(() => {
        if (mongoose.models.Todo) return mongoose.models.Todo
        const HistorySchema = new mongoose.Schema(
          { title: String, description: String, editedAt: String },
          { _id: false },
        )
        const TodoSchema = new mongoose.Schema(
          {
            title: { type: String, required: true },
            description: { type: String, default: '' },
            completed: { type: Boolean, default: false },
            date: { type: String, default: '' },
            createdAt: String,
            completedAt: { type: String, default: null },
            updatedAt: String,
            history: { type: [HistorySchema], default: undefined },
          },
          { versionKey: false },
        )
        // 응답 직렬화 시 _id → id (프론트는 todo.id 사용)
        TodoSchema.set('toJSON', {
          transform: (_doc, ret: Record<string, unknown>) => {
            ret.id = String(ret._id)
            delete ret._id
            return ret
          },
        })
        return mongoose.model('Todo', TodoSchema)
      })
    }
    return modelPromise
  }

  const json = (res: ServerResponse, code: number, data: unknown) => {
    res.statusCode = code
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(data))
  }
  const readBody = (req: IncomingMessage) =>
    new Promise<any>((resolve) => {
      let raw = ''
      req.on('data', (c) => (raw += c))
      req.on('end', () => {
        try {
          resolve(raw ? JSON.parse(raw) : {})
        } catch {
          resolve({})
        }
      })
    })

  return {
    name: 'local-api-todos',
    apply: 'serve',
    configureServer(server) {
      // 마운트 경로가 '/api/todos' 이므로 내부 req.url 은 '/'(목록) 또는 '/:id'
      server.middlewares.use('/api/todos', async (req, res) => {
        try {
          const Todo = await getTodoModel()
          const path = (req.url || '/').split('?')[0]
          const id = path === '/' ? '' : path.slice(1)

          if (!id) {
            if (req.method === 'GET') return json(res, 200, await Todo.find().sort({ _id: -1 }))
            if (req.method === 'POST') return json(res, 201, await Todo.create(await readBody(req)))
            return json(res, 405, { error: 'Method Not Allowed' })
          }

          if (req.method === 'PATCH') {
            const { set, pushHistory } = await readBody(req)
            const ops: Record<string, unknown> = {}
            if (set && typeof set === 'object') ops.$set = set
            if (pushHistory) ops.$push = { history: pushHistory }
            if (!ops.$set && !ops.$push) return json(res, 400, { error: 'nothing to update' })
            const updated = await Todo.findByIdAndUpdate(id, ops, { new: true })
            return updated ? json(res, 200, updated) : json(res, 404, { error: 'not found' })
          }
          if (req.method === 'DELETE') {
            const del = await Todo.findByIdAndDelete(id)
            return del ? json(res, 200, { ok: true }) : json(res, 404, { error: 'not found' })
          }
          return json(res, 405, { error: 'Method Not Allowed' })
        } catch (e) {
          json(res, 500, { error: (e as Error).message })
        }
      })
    },
  }
}

// 개발 서버는 localhost:5173 고정 (요청 사항)
export default defineConfig({
  plugins: [react(), apiDev()], // ← DB 로컬 연동 불필요 시 apiDev() 주석
  server: {
    port: 5173,
    strictPort: true,
    open: false,
  },
})
