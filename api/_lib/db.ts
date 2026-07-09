// ============================================================
//  Todo 모델 (Vercel 서버리스 함수 공용)
//  연결은 mongo.ts(connectMongo)가 담당 — 이 파일은 모델 정의만.
// ============================================================
import type mongoose from 'mongoose'
import type { Model } from 'mongoose'
import { connectMongo } from './mongo.js'

type Mongoose = typeof mongoose
type TodoModel = Model<any>

const g = globalThis as unknown as {
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
  const m = await connectMongo()
  if (!g._todoModel) g._todoModel = buildTodoModel(m)
  return g._todoModel
}
