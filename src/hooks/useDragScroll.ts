// 마우스로 가로줄(.row-scroll)을 잡아끌어 스크롤 + 가벼운 관성 (기존 UI.enableDragScroll 이식)
// 이벤트 위임이라 동적으로 추가된 줄에도 자동 적용. 터치는 네이티브 그대로.
import { useEffect } from 'react'

export function useDragScroll() {
  useEffect(() => {
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let el: HTMLElement | null = null
    let startX = 0
    let startScroll = 0
    let dragging = false
    let moved = false
    let velX = 0
    let lastX = 0
    let lastT = 0
    let raf = 0

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      const target = (e.target as HTMLElement).closest<HTMLElement>('.row-scroll')
      if (!target) return
      cancelAnimationFrame(raf)
      el = target
      startX = e.clientX
      startScroll = el.scrollLeft
      dragging = true
      moved = false
      velX = 0
      lastX = e.clientX
      lastT = performance.now()
    }

    const onMove = (e: PointerEvent) => {
      if (!dragging || !el) return
      const dx = e.clientX - startX
      if (Math.abs(dx) > 4) moved = true
      el.scrollLeft = startScroll - dx
      const now = performance.now()
      const dt = now - lastT
      if (dt > 0) velX = (e.clientX - lastX) / dt
      lastX = e.clientX
      lastT = now
      if (moved) {
        el.classList.add('dragging')
        e.preventDefault()
      }
    }

    const end = () => {
      if (!dragging) return
      dragging = false
      const dragged = moved
      const scroller = el
      if (scroller) scroller.classList.remove('dragging')
      if (dragged && scroller) {
        const suppress = (ev: Event) => {
          ev.preventDefault()
          ev.stopPropagation()
          scroller.removeEventListener('click', suppress, true)
        }
        scroller.addEventListener('click', suppress, true)
        setTimeout(() => scroller.removeEventListener('click', suppress, true), 50)
      }
      if (dragged && scroller && !reduced && Math.abs(velX) > 0.05) {
        let v = Math.max(-40, Math.min(40, velX * 16))
        const step = () => {
          scroller.scrollLeft -= v
          v *= 0.92
          if (Math.abs(v) > 0.5) raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
      }
      el = null
    }

    document.addEventListener('pointerdown', onDown)
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', end)
    document.addEventListener('pointercancel', end)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', end)
      document.removeEventListener('pointercancel', end)
    }
  }, [])
}
