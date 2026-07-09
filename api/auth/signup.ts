// POST /api/auth/signup  → 회원가입 { username, password }
// 비밀번호는 bcrypt 단방향 해시로만 저장 (평문/복호화 불가)
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getUserModel } from '../_lib/userModel.js'
import { hashPassword } from '../_lib/hash.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { username, password } = (req.body || {}) as {
      username?: string
      password?: string
    }
    if (!username || !password) {
      return res.status(400).json({ error: '아이디와 비밀번호를 입력해주세요.' })
    }

    const User = await getUserModel()

    // ---------- 단방향 해시 후 저장 ----------
    const passwordHash = await hashPassword(password)
    const created = await User.create({
      username,
      passwordHash,
      createdAt: new Date().toLocaleString('ko-KR'),
    })

    // toJSON 변환으로 passwordHash 는 응답에서 제거됨
    return res.status(201).json(created)
  } catch (e) {
    // unique 인덱스 중복(E11000) → 409
    if ((e as Error).message?.includes('E11000')) {
      return res.status(409).json({ error: '이미 사용 중인 아이디입니다.' })
    }
    return res.status(500).json({ error: (e as Error).message })
  }
}
