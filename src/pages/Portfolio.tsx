// ============================================================
//  포트폴리오 / 내 정보 (기존 about.html + themes.js 이식)
//  테마: 기본(파란색) / 테트리스(네온 아케이드) — 테트리스 테마에서 게임 노출
// ============================================================
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Tetris from '../components/Tetris'

type Theme = 'default' | 'mario'

const PROJECTS = [
  {
    icon: '🎬',
    title: '영화 탐색 사이트 (OTT 스타일)',
    desc: 'TMDB API를 연동해 인기·최신·장르별 영화를 둘러보고, 상세 정보와 예고편·출연진을 확인하고, 찜해두는 영화 탐색 사이트입니다.',
    to: '/movie',
    btn: '영화 보러가기',
    btnCls: 'bg-rose-600 hover:bg-rose-700 text-white',
  },
  {
    icon: '📅',
    title: '스케줄 관리 TODO 앱',
    desc: '날짜별로 작업을 등록하고 완료 상태로 관리하는 일정 관리 앱. Firebase Realtime Database로 실시간 저장·동기화됩니다.',
    to: '/',
    btn: '앱 체험하기',
    btnCls: 'bg-green-600 hover:bg-green-700 text-white',
  },
  {
    icon: '📚',
    title: '교과검정시스템',
    desc: '교과서 검정 업무를 전산화한 시스템. 데이터 등록·심사 흐름과 관련 기능 개발을 맡았습니다.',
  },
  {
    icon: '🤖',
    title: 'AI 기반 API 서비스',
    desc: 'LangChain으로 LLM을 연동해 사용자 요청을 처리하는 API 서비스. API 설계와 연동 로직 구현을 맡았습니다.',
  },
  {
    icon: '💳',
    title: 'PG결제 통합 솔루션',
    desc: '여러 PG(결제대행)사를 하나로 묶어 연동하는 결제 모듈. 결제 연동과 거래 처리 로직 개발을 맡았습니다.',
  },
  {
    icon: '🛍️',
    title: '개인 프로젝트',
    desc: '쇼핑몰, 학습용 토이 프로젝트, 스케줄러 등 관심 분야를 직접 만들어보며 꾸준히 학습하고 있습니다.',
  },
]

export default function Portfolio() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('currentTheme')
    return saved === 'mario' ? 'mario' : 'default'
  })
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    document.body.classList.remove('theme-default', 'theme-mario')
    document.body.classList.add(`theme-${theme}`)
    localStorage.setItem('currentTheme', theme)
    return () => document.body.classList.remove('theme-default', 'theme-mario')
  }, [theme])

  const apply = (t: Theme) => {
    setTheme(t)
    setModalOpen(false)
  }

  const profile = (
    <section id="profileSection" className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-8">
      <div className="text-center">
        <div className="mb-6">
          <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto bg-indigo-600 rounded-full flex items-center justify-center text-5xl">
            💻
          </div>
        </div>
        <h2 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1">
          임현수 <span className="text-gray-400 font-medium text-xl sm:text-2xl">Lim Hyeon Soo</span>
        </h2>
        <p className="text-indigo-600 font-bold text-lg sm:text-xl mb-4">열심히 배우고 일하는 2년차 개발자</p>
        <p className="text-gray-600 text-base sm:text-lg mb-6">
          요구사항을 정확히 이해하고 팀과 소통하는 것을 중요하게 생각합니다.
          <br />
          코드 품질, 명확한 문서화, 팀과의 협력으로 더 좋은 결과를 만드는 개발자입니다.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full font-semibold min-h-[44px] flex items-center">
            ☕ Java
          </span>
        </div>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold min-h-[44px]"
        >
          📅 TODO 앱 시작하기
        </Link>
      </div>
    </section>
  )

  return (
    <div id="themeBody" className="min-h-screen font-sans transition-colors duration-300">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600">💻 Coding Sister</h1>
            <div className="flex flex-wrap gap-2 items-center shrink-0">
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition font-semibold min-h-[44px] text-sm"
              >
                🎨 테마
              </button>
              <Link to="/movie" className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition font-semibold min-h-[44px] inline-block">
                🎬 영화
              </Link>
              <Link to="/" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold min-h-[44px] inline-block">
                📅 TODO 앱
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 테트리스 테마에서는 게임이 위에, 프로필이 아래 */}
        {theme === 'mario' && <Tetris />}
        {profile}

        {/* 주요 프로젝트 */}
        <section className="mb-8">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">📚 주요 프로젝트</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROJECTS.map((p) => (
              <div key={p.title} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105">
                <div className="text-4xl mb-4">{p.icon}</div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">{p.title}</h4>
                <p className="text-gray-600 text-sm mb-4">{p.desc}</p>
                {p.to && (
                  <Link
                    to={p.to}
                    className={`inline-flex items-center justify-center px-4 py-2 rounded-lg transition font-semibold text-sm min-h-[44px] ${p.btnCls}`}
                  >
                    {p.btn}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 연락처 */}
        <section className="bg-indigo-600 text-white rounded-lg shadow-lg p-6 sm:p-8 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold mb-4">📬 연락처</h3>
          <p className="text-lg mb-6">궁금한 점이 있으시면 편하게 연락 주세요.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="mailto:hyen8221@gmail.com" className="px-6 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition font-semibold min-h-[44px] flex items-center">
              📧 hyen8221@gmail.com
            </a>
            <a href="https://github.com/hyeonsoo123" target="_blank" rel="noreferrer" className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition font-semibold min-h-[44px] flex items-center">
              🐙 github.com/hyeonsoo123
            </a>
          </div>
        </section>
      </main>

      {/* 테마 모달 */}
      {modalOpen && (
        <div
          id="themeModal"
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false)
          }}
        >
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">🎨 테마 선택</h3>
            <div className="space-y-3 mb-6">
              <button
                onClick={() => apply('default')}
                className={`themeOption w-full p-4 rounded-lg border-2 transition text-left font-semibold ${
                  theme === 'default' ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 bg-gray-50'
                } hover:bg-indigo-100`}
              >
                <span className="text-2xl mb-2">💙</span>
                <p>기본 테마 (파란색)</p>
                <p className="text-xs text-gray-600 font-normal">{theme === 'default' ? '현재 테마' : ''}</p>
              </button>
              <button
                onClick={() => apply('mario')}
                className={`themeOption w-full p-4 rounded-lg border-2 transition text-left font-semibold ${
                  theme === 'mario' ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 bg-gray-50'
                } hover:bg-gray-100`}
              >
                <span className="inline-flex flex-col gap-0.5 mb-2">
                  <span className="flex gap-0.5">
                    <span className="w-3 h-3" />
                    <span className="w-3 h-3 bg-cyan-400 border border-black" />
                    <span className="w-3 h-3 bg-yellow-400 border border-black" />
                  </span>
                  <span className="flex gap-0.5">
                    <span className="w-3 h-3 bg-purple-500 border border-black" />
                    <span className="w-3 h-3 bg-green-500 border border-black" />
                    <span className="w-3 h-3" />
                  </span>
                </span>
                <p>테트리스 테마</p>
                <p className="text-xs text-gray-600 font-normal">네온 아케이드 스타일</p>
              </button>
            </div>
            <button
              onClick={() => setModalOpen(false)}
              className="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold min-h-[44px]"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
