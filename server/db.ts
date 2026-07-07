// ============================================================
//  MongoDB 연결 + Todo 모델 (Vercel 서버리스 함수 공용)
//  mongoose 를 최상단이 아닌 함수 안에서 지연 import 한다.
//  → 번들/로드 오류도 핸들러 try/catch 로 잡아 JSON 으로 노출 가능,
//    서버리스 인스턴스 재사용 시 커넥션/모델을 전역 캐싱해 재활용.
// ============================================================
import type mongoose from 'mongoose'
import type { Model } from 'mongoose'

type Mongoose = typeof mongoose
type TodoModel = Model<any>

const g = globalThis as unknown as {
  _mongoConn?: Promise<unknown>
  _todoModel?: TodoModel
}

function buildTodoModel(m: Mongoose): TodoModel {
  if (m.models.Todo) return m.models.Todo

  const HistorySchema = new m.Schema(
    { title: String, description: String, editedAt: String },
    { _id: false },
  )
  const TodoSchema = new m.Schema(
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
  return m.model('Todo', TodoSchema)
}

// 연결 + Todo 모델 반환. mongoose 로드/연결 오류는 여기서 throw → 핸들러가 잡음.
export async function getTodoModel(): Promise<TodoModel> {
  const m = (await import('mongoose')).default
  if (!g._mongoConn) {
    const uri = process.env.MONGODB_URI
    if (!uri) throw new Error('MONGODB_URI 환경변수가 설정되지 않았습니다.')
    g._mongoConn = m.connect(uri)
  }
  await g._mongoConn
  if (!g._todoModel) g._todoModel = buildTodoModel(m)
  return g._todoModel
}
