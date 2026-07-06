// React i18n 컨텍스트 — dict.ts 를 감싸 컴포넌트에서 t/lang/setLang 사용
import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { t as translate, getLang, setLang, LANGS } from './dict'

interface I18nCtx {
  t: (key: string, params?: Record<string, string | number>) => string
  lang: string
  setLang: (l: string) => void
  langs: typeof LANGS
}

const Ctx = createContext<I18nCtx | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = getLang()
  }, [])

  const value: I18nCtx = { t: translate, lang: getLang(), setLang, langs: LANGS }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

// 언어 선택 <select> — 헤더 공용
export function LangSelect({ className = '' }: { className?: string }) {
  const { lang, setLang, langs } = useI18n()
  return (
    <select
      aria-label="Language"
      value={lang}
      onChange={(e) => setLang(e.target.value)}
      className={
        className ||
        'px-2 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold min-h-[44px] outline-none cursor-pointer border border-indigo-100'
      }
    >
      {Object.entries(langs).map(([k, v]) => (
        <option key={k} value={k}>
          {v.label}
        </option>
      ))}
    </select>
  )
}
