// ============================================================
//  회원가입 페이지 — /signup
//  authApi.signup 호출 → 서버(bcrypt 단방향 해시)에서 MongoDB 저장
//  화면은 입력/표시만 담당하고 통신은 lib/authApi.ts 에 위임
// ============================================================
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useBodyClass } from '../hooks/useBodyClass'
import { useToast } from '../components/Toast'
import { authApi } from '../lib/authApi'

export default function Signup() {
  useBodyClass('plain-bg')
  const navigate = useNavigate()
  const toast = useToast()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const user = await authApi.signup(username, password)
      toast(`🎉 ${user.username}님 가입 완료!`)
      navigate('/')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls =
    'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base min-h-[44px]'

  return (
    <div className="min-h-screen font-sans">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600">📝 회원가입</h1>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition font-semibold min-h-[44px] text-sm"
            >
              📅 캘린더로
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 sm:px-6 py-10">
        <form onSubmit={onSubmit} className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">계정 만들기</h2>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">아이디</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className={inputCls}
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className={inputCls}
            />
          </div>

          {error && (
            <p className="mb-4 text-sm text-red-500 bg-red-50 rounded-lg px-4 py-3">⚠️ {error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '가입 중...' : '회원가입'}
          </button>

          <p className="mt-4 text-xs text-gray-400 text-center leading-relaxed">
            비밀번호는 bcrypt 단방향 해시로 암호화되어 저장됩니다.
          </p>
        </form>
      </main>
    </div>
  )
}
