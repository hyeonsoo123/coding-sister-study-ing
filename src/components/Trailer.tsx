// 예고편 전체화면 모달 (기존 UI.playTrailer 이식) — 영화 라우트 컨텍스트
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

type PlayFn = (key: string) => void
const Ctx = createContext<PlayFn>(() => {})

export function TrailerProvider({ children }: { children: ReactNode }) {
  const [key, setKey] = useState<string | null>(null)
  const play = useCallback<PlayFn>((k) => setKey(k), [])
  const close = useCallback(() => setKey(null), [])

  useEffect(() => {
    if (!key) return
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [key, close])

  return (
    <Ctx.Provider value={play}>
      {children}
      {key && (
        <div
          className="fixed inset-0 z-[110] bg-black/85 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) close()
          }}
        >
          <div className="relative w-full max-w-4xl">
            <button
              type="button"
              aria-label="close"
              onClick={close}
              className="absolute -top-10 right-0 text-white text-3xl leading-none hover:text-gray-300"
            >
              ✕
            </button>
            <div
              className="relative w-full rounded-xl overflow-hidden shadow-2xl bg-black"
              style={{ aspectRatio: '16/9' }}
            >
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${key}?autoplay=1`}
                title="trailer"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture"
              />
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}

export function useTrailer(): PlayFn {
  return useContext(Ctx)
}
