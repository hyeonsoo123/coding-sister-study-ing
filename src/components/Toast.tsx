// 하단 토스트 알림 (기존 UI.toast 이식) — 전역 컨텍스트
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

type ToastFn = (message: string) => void
const Ctx = createContext<ToastFn>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState('')
  const [visible, setVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const toast = useCallback<ToastFn>((message) => {
    setMsg(message)
    setVisible(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setVisible(false), 1800)
  }, [])

  return (
    <Ctx.Provider value={toast}>
      {children}
      <div
        id="csToast"
        className={`fixed left-1/2 -translate-x-1/2 bottom-6 z-[100] px-5 py-3 rounded-full bg-gray-900 text-white text-sm font-semibold shadow-lg pointer-events-none transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {msg}
      </div>
    </Ctx.Provider>
  )
}

export function useToast(): ToastFn {
  return useContext(Ctx)
}
