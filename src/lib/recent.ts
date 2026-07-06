// ============================================================
//  최근 본 작품 (localStorage) — 상세 열 때 기록, 홈에서 노출
//  영화/TV 겸용: (media_type, id)로 중복 제거, 최신순, 최대 20개
// ============================================================
import type { MediaItem } from './tmdb'

const KEY = 'cs_recent'
const MAX = 20

export interface RecentItem {
  id: number
  media_type: string
  title?: string
  poster_path?: string | null
  vote_average?: number
  release_date?: string
}

export const Recent = {
  all(): RecentItem[] {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]') || []
    } catch {
      return []
    }
  },
  add(item: MediaItem, type?: string) {
    if (!item || !item.id) return
    const t = item.media_type || type || 'movie'
    const list = this.all().filter((m) => !(m.id === item.id && (m.media_type || 'movie') === t))
    list.unshift({
      id: item.id,
      media_type: t,
      title: item.title || item.name,
      poster_path: item.poster_path,
      vote_average: item.vote_average,
      release_date: item.release_date || item.first_air_date,
    })
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)))
  },
}
