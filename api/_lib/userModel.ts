// ============================================================
//  User 모델 (Vercel 서버리스 함수 공용)
//  비밀번호는 평문이 아닌 bcrypt 해시(passwordHash)만 저장한다.
//  연결은 mongo.ts(connectMongo)가 담당 — 이 파일은 모델 정의만.
// ============================================================
import type mongoose from 'mongoose'
import type { Model } from 'mongoose'
import { connectMongo } from './mongo.js'

type Mongoose = typeof mongoose
type UserModel = Model<any>

const g = globalThis as unknown as {
  _userModel?: UserModel
}

function buildUserModel(m: Mongoose): UserModel {
  if (m.models.User) return m.models.User

  const UserSchema = new m.Schema(
    {
      username: { type: String, required: true, unique: true, trim: true },
      passwordHash: { type: String, required: true },
      createdAt: String,
    },
    { versionKey: false },
  )

  UserSchema.set('toJSON', {
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = String(ret._id)
      delete ret._id
      delete ret.passwordHash
      return ret
    },
  })
  return m.model('User', UserSchema)
}

export async function getUserModel(): Promise<UserModel> {
  const m = await connectMongo()
  if (!g._userModel) g._userModel = buildUserModel(m)
  return g._userModel
}
