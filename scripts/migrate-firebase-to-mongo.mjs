// ============================================================
//  Firebase Realtime DB → MongoDB(Atlas) 1회성 마이그레이션
//  실행: npm run db:migrate   (강제 재삽입: npm run db:migrate -- --force)
//  기존 Firebase의 todos 를 읽어 Mongo 의 todos 컬렉션으로 이관한다.
//  (Firebase 데이터는 건드리지 않음 — 읽기만 함)
// ============================================================
import 'dotenv/config'
import dns from 'dns'
import mongoose, { Schema } from 'mongoose'

dns.setServers(['8.8.8.8', '1.1.1.1'])

const FIREBASE_URL = 'https://coding-sister-study-default-rtdb.firebaseio.com/todos.json'
const MONGODB_URI = process.env.MONGODB_URI
const force = process.argv.includes('--force')

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI 가 설정되지 않았습니다 (.env 확인).')
  process.exit(1)
}

const HistorySchema = new Schema({ title: String, description: String, editedAt: String }, { _id: false })
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
const Todo = mongoose.models.Todo || mongoose.model('Todo', TodoSchema)

// Firebase 한 건 → Mongo 문서 형태로 변환 (구버전 text 필드도 title 로 흡수)
function transform(raw) {
  return {
    title: raw.title || raw.text || '(제목 없음)',
    description: raw.description || '',
    completed: !!raw.completed,
    date: raw.date || '',
    createdAt: raw.createdAt || '',
    completedAt: raw.completedAt ?? null,
    updatedAt: raw.updatedAt || undefined,
    history: raw.history ? Object.values(raw.history) : undefined,
  }
}

console.log('· Firebase 데이터 조회 중...')
const res = await fetch(FIREBASE_URL)
if (!res.ok) {
  console.error(`❌ Firebase 조회 실패: ${res.status}`)
  process.exit(1)
}
const data = (await res.json()) || {}
// push 키는 시간순 → 그 순서대로 삽입해 _id(생성시각) 순서를 보존
const docs = Object.entries(data).map(([, v]) => transform(v))
console.log(`· Firebase todos ${docs.length}건 발견`)

await mongoose.connect(MONGODB_URI)
console.log('· MongoDB 연결됨')

const existing = await Todo.countDocuments()
if (existing > 0 && !force) {
  console.log(`⚠️  Mongo 에 이미 ${existing}건이 있어 중단합니다. 덮어쓰려면: npm run db:migrate -- --force`)
  await mongoose.connection.close()
  process.exit(0)
}
if (force && existing > 0) {
  await Todo.deleteMany({})
  console.log(`· 기존 ${existing}건 삭제 (--force)`)
}

let ok = 0
for (const doc of docs) {
  await Todo.create(doc) // 순차 삽입으로 _id 순서 = 시간순 보존
  ok++
}
console.log(`✅ ${ok}건 이관 완료`)

const total = await Todo.countDocuments()
console.log(`· 현재 Mongo todos 총 ${total}건`)
await mongoose.connection.close()
