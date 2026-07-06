// 영화 라우트 공통 셸 — 다크 테마(body.movie-app) + 예고편 모달 + 맨위로 + 드래그스크롤
import { type ReactNode } from 'react'
import { useBodyClass } from '../../hooks/useBodyClass'
import { useDragScroll } from '../../hooks/useDragScroll'
import { TrailerProvider } from '../../components/Trailer'
import BackToTop from '../../components/BackToTop'

export default function MovieShell({ children }: { children: ReactNode }) {
  useBodyClass('movie-app')
  useDragScroll()
  return (
    <TrailerProvider>
      {children}
      <BackToTop />
    </TrailerProvider>
  )
}
