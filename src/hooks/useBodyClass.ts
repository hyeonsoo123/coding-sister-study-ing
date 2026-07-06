// 라우트 진입 동안 <body>에 클래스 부여, 이탈 시 제거 (CSS 스코프용)
import { useEffect } from 'react'

export function useBodyClass(...classes: string[]) {
  useEffect(() => {
    const list = classes.filter(Boolean)
    document.body.classList.add(...list)
    return () => document.body.classList.remove(...list)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes.join(' ')])
}
