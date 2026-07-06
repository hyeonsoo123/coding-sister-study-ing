// 맨 위로 ↑ 버튼 (기존 UI.createBackToTop 이식)
import { useEffect, useState } from 'react'

export default function BackToTop() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const reduced =
    typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <button
      type="button"
      aria-label="맨 위로"
      onClick={() => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })}
      className={`fixed bottom-6 right-6 z-[90] w-12 h-12 rounded-full bg-indigo-600 text-white text-xl font-bold shadow-lg transition-opacity duration-300 hover:bg-indigo-700 ${
        show ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      ↑
    </button>
  )
}
