// 가로 슬라이드 줄 (기존 home.js createRow 이식) — 좌우 화살표 + 드래그 스크롤
import { useRef, type ReactNode } from 'react'

export default function Row({ title, children }: { title: string; children: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const by = (dir: number) => {
    const el = scrollRef.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' })
  }

  return (
    <section className="mb-8">
      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 px-1">{title}</h3>
      <div className="relative group/row">
        <button type="button" className="row-arrow left" aria-label="왼쪽" onClick={() => by(-1)}>
          ‹
        </button>
        <div ref={scrollRef} className="row-scroll flex gap-3 overflow-x-auto pb-2">
          {children}
        </div>
        <button type="button" className="row-arrow right" aria-label="오른쪽" onClick={() => by(1)}>
          ›
        </button>
      </div>
    </section>
  )
}

export function SkeletonCards({ n = 6 }: { n?: number }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="shrink-0 w-36 sm:w-44 aspect-[2/3] rounded-lg bg-gray-200 animate-pulse" />
      ))}
    </>
  )
}

export function SkeletonGrid({ n = 12 }: { n?: number }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="aspect-[2/3] rounded-lg bg-gray-200 animate-pulse" />
      ))}
    </>
  )
}

export function EmptyState({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="col-span-full text-center py-16">
      <div className="text-6xl mb-4">{emoji}</div>
      <p className="text-lg font-bold text-gray-700">{title}</p>
      <p className="text-gray-500 mt-1">{desc}</p>
    </div>
  )
}
