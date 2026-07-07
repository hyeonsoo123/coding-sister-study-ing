// ============================================================
//  MongoDB 연결 + Todo 모델 (Vercel 서버리스 함수 공용)
//  서버리스는 요청마다 새 인스턴스가 뜰 수 있어 커넥션을 전역 캐싱한다.
// ============================================================
import mongoose, { Schema } from 'mongoose'

// 서버리스 인스턴스 재사용 시 커넥션 재활용 (매 요청 새 연결 방지)
const g = globalThis as unknown as { _mongoConn?: Promise<typeof mongoose> }

export async function dbConnect() {
  if (!g._mongoConn) {
    const uri = process.env.MONGODB_URI
    if (!uri) throw new Error('MONGODB_URI 환경변수가 설정되지 않았습니다.')
    g._mongoConn = mongoose.connect(uri)
  }
  return g._mongoConn
}

const HistorySchema = new Schema(
  {
    title: String,
    description: String,
    editedAt: String,
  },
  { _id: false },
)

const TodoSchema = new Schema(
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

// 응답 직렬화 시 _id → id 로 변환 (프론트는 todo.id 를 사용)
TodoSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, unknown>) => {
    ret.id = String(ret._id)
    delete ret._id
    return ret
  },
})

// 서버리스 hot-reload 시 모델 중복 등록 방지
export const Todo = mongoose.models.Todo || mongoose.model('Todo', TodoSchema)
