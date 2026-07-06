// ============================================================
//  공용 포맷/이미지 헬퍼 (기존 ui.js 의 순수 함수 부분 이식)
// ============================================================
import { TMDB } from './tmdb'
import { t } from '../i18n/dict'

export const POSTER_FALLBACK =
  'data:image/svg+xml;charset=utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="50%" font-size="120" text-anchor="middle" dominant-baseline="middle">🎬</text></svg>`,
  )

export const PROFILE_FALLBACK =
  'data:image/svg+xml;charset=utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="52%" font-size="150" text-anchor="middle" dominant-baseline="middle">👤</text></svg>`,
  )

export function img(path?: string | null, size = 'w500'): string {
  return path ? `${TMDB.IMG_URL}/${size}${path}` : POSTER_FALLBACK
}

export function profileImg(path?: string | null, size = 'w185'): string {
  return path ? `${TMDB.IMG_URL}/${size}${path}` : PROFILE_FALLBACK
}

export function year(dateStr?: string): string {
  return dateStr ? dateStr.slice(0, 4) : t('tba')
}

export function rating(value?: number): string {
  return value ? Number(value).toFixed(1) : '–'
}

// release_dates 응답에서 한국(KR) 관람등급 문자열 추출
export function certKR(releaseDates: any): string | null {
  const kr = (releaseDates?.results || []).find((r: any) => r.iso_3166_1 === 'KR')
  if (!kr) return null
  const found = (kr.release_dates || []).map((d: any) => d.certification).find((c: string) => c)
  return found || null
}

export function certLabel(cert?: string | null): { text: string; cls: string } | null {
  if (!cert) return null
  const c = String(cert).toUpperCase()
  if (c === 'ALL' || c === 'G') return { text: '전체', cls: 'bg-green-100 text-green-700' }
  if (c === '7') return { text: '7세', cls: 'bg-lime-100 text-lime-700' }
  if (c === '12') return { text: '12세', cls: 'bg-sky-100 text-sky-700' }
  if (c === '15') return { text: '15세', cls: 'bg-amber-100 text-amber-700' }
  if (c === '18' || c === '19' || c === 'R') return { text: '청불', cls: 'bg-red-100 text-red-700' }
  return { text: String(cert), cls: 'bg-gray-100 text-gray-700' }
}
