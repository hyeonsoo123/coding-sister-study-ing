// ============================================================
//  찜 목록 (localStorage) — 영화/TV 겸용, (media_type, id) 로 구분
//  변경 시 'favchange' 커스텀 이벤트를 발생시켜 화면들이 동기화되게 함
// ============================================================
import type { MediaItem } from './tmdb'

const KEY = 'cs_movie_favorites'

export interface FavItem {
  id: number
  media_type: string
  title?: string
  poster_path?: string | null
  vote_average?: number
  release_date?: string
}

function read(): FavItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') || []
  } catch {
    return []
  }
}

function write(list: FavItem[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

function typeOf(item: MediaItem, fallback?: string): string {
  return (item.media_type as string) || fallback || 'movie'
}

export const Favorites = {
  all(): FavItem[] {
    return read()
  },
  has(id: number, type = 'movie'): boolean {
    return read().some((m) => m.id === id && (m.media_type || 'movie') === type)
  },
  // 토글 → 추가되면 true, 제거되면 false
  toggle(item: MediaItem, type?: string): boolean {
    const t = typeOf(item, type)
    const list = read()
    const idx = list.findIndex((m) => m.id === item.id && (m.media_type || 'movie') === t)
    if (idx >= 0) {
      list.splice(idx, 1)
      write(list)
      return false
    }
    list.unshift({
      id: item.id,
      media_type: t,
      title: item.title || item.name,
      poster_path: item.poster_path,
      vote_average: item.vote_average,
      release_date: item.release_date || item.first_air_date,
    })
    write(list)
    return true
  },
  count(): number {
    return read().length
  },
}

export function emitFavChange() {
  document.dispatchEvent(new CustomEvent('favchange'))
}
