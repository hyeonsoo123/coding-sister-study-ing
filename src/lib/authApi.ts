// ============================================================
//  인증 데이터 접근 계층 — /api/auth/* 호출
//  화면 코드는 이 모듈만 사용하고 fetch 세부는 여기서 감춘다.
// ============================================================

export interface User {
  id: string
  username: string
  createdAt: string
}

const API = '/api/auth'

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error((data as { error?: string }).error || `POST ${path} → ${r.status}`)
  return data as T
}

export const authApi = {
  // 회원가입 — 비밀번호는 서버에서 bcrypt 단방향 해시 후 저장됨
  signup(username: string, password: string): Promise<User> {
    return post<User>('/signup', { username, password })
  },
}
