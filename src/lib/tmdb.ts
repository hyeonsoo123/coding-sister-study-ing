// ============================================================
//  TMDB API 설정 + 호출 래퍼 (기존 config.js + api.js 이식)
//  - 모든 요청에 언어를 붙이고 Bearer 토큰으로 인증
//  - 언어는 localStorage('cs_lang') 기반 (i18n 과 동일 소스)
// ============================================================

const LANG_MAP: Record<string, string> = { ko: 'ko-KR', en: 'en-US', ja: 'ja-JP' }

function currentTmdbLang(): string {
  const l = localStorage.getItem('cs_lang') || 'ko'
  return LANG_MAP[l] || 'ko-KR'
}

export const TMDB = {
  // v4 액세스 토큰 (읽기 전용 — 조회만 가능)
  ACCESS_TOKEN:
    'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlOTUwZmMwZWM0NjU1ZGRiZmM5MGI5OWVjMzJmYTMyNiIsIm5iZiI6MTc4Mjg3NzczMC4yNzksInN1YiI6IjZhNDQ4ZTIyYzRhMGYxMjViOGRmMGRkYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.0el8e3-qoPJDV9SDxSWyzH4wF9Xgqiuv5bU5AF9znuE',
  API_KEY: 'e950fc0ec4655ddbfc90b99ec32fa326',
  BASE_URL: 'https://api.themoviedb.org/3',
  IMG_URL: 'https://image.tmdb.org/t/p',
  REGION: 'KR',
}

const headers = {
  Authorization: `Bearer ${TMDB.ACCESS_TOKEN}`,
  accept: 'application/json',
}

type Params = Record<string, string | number | boolean | undefined | null>

export async function get<T = any>(path: string, params: Params = {}): Promise<T> {
  const url = new URL(`${TMDB.BASE_URL}${path}`)
  url.searchParams.set('language', currentTmdbLang())
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }
  const res = await fetch(url, { headers })
  if (!res.ok) {
    throw new Error(`TMDB 요청 실패 (${res.status} ${res.statusText})`)
  }
  return res.json()
}

const DETAIL_APPEND =
  'videos,credits,similar,recommendations,reviews,release_dates,watch/providers,images,keywords'

export const TMDBApi = {
  get,
  // ----- 목록/둘러보기 -----
  popular: (page = 1) => get('/movie/popular', { page }),
  nowPlaying: (page = 1) => get('/movie/now_playing', { page, region: TMDB.REGION }),
  upcoming: (page = 1) => get('/movie/upcoming', { page, region: TMDB.REGION }),
  topRated: (page = 1) => get('/movie/top_rated', { page }),
  trending: (window: 'day' | 'week' = 'week') => get(`/trending/movie/${window}`),

  // ----- 장르/탐색 -----
  genres: () => get('/genre/movie/list'),
  discover: (params: Params = {}) =>
    get('/discover/movie', { sort_by: 'popularity.desc', include_adult: false, ...params }),
  byGenre: (genreId: number, page = 1) =>
    get('/discover/movie', { with_genres: genreId, sort_by: 'popularity.desc', page }),

  // ----- 검색 -----
  search: (query: string, page = 1) => get('/search/movie', { query, page, include_adult: false }),

  // ----- 상세 (부가정보 한 번에) -----
  detail: (id: string | number) =>
    get(`/movie/${id}`, {
      append_to_response: DETAIL_APPEND,
      include_image_language: 'ko,en,null',
    }),

  reviews: (id: string | number, page = 1) => get(`/movie/${id}/reviews`, { page, language: 'en-US' }),
  movieVideos: (id: string | number) => get(`/movie/${id}/videos`),

  // ----- TV / 시리즈 -----
  tvPopular: (page = 1) => get('/tv/popular', { page }),
  tvOnTheAir: (page = 1) => get('/tv/on_the_air', { page }),
  tvTopRated: (page = 1) => get('/tv/top_rated', { page }),
  tvTrending: (window: 'day' | 'week' = 'week') => get(`/trending/tv/${window}`),
  tvGenres: () => get('/genre/tv/list'),
  tvByGenre: (genreId: number, page = 1) =>
    get('/discover/tv', { with_genres: genreId, sort_by: 'popularity.desc', page }),
  tvDetail: (id: string | number) =>
    get(`/tv/${id}`, {
      append_to_response:
        'videos,aggregate_credits,similar,recommendations,reviews,content_ratings,watch/providers,images,keywords',
      include_image_language: 'ko,en,null',
    }),
  tvReviews: (id: string | number, page = 1) => get(`/tv/${id}/reviews`, { page, language: 'en-US' }),

  // ----- 통합 검색 (영화 + TV + 인물) -----
  searchMulti: (query: string, page = 1) => get('/search/multi', { query, page, include_adult: false }),

  recommendations: (mediaType: string, id: string | number) =>
    get(`/${mediaType === 'tv' ? 'tv' : 'movie'}/${id}/recommendations`),

  // ----- 인물 (영화+TV 통합 크레딧) -----
  person: (id: string | number) => get(`/person/${id}`, { append_to_response: 'combined_credits,images' }),
}

// YouTube 예고편 key 고르기 (공식 Trailer 우선)
export function pickYouTubeKey(data: any): string | null {
  const list = (data?.results || []).filter((v: any) => v.site === 'YouTube')
  const v =
    list.find((x: any) => x.type === 'Trailer' && x.official) ||
    list.find((x: any) => x.type === 'Trailer') ||
    list.find((x: any) => x.type === 'Teaser') ||
    list[0]
  return v ? v.key : null
}

// ----- 공통 미디어 아이템 (카드/찜/최근에서 쓰는 최소 형태) -----
export interface MediaItem {
  id: number
  media_type?: 'movie' | 'tv' | 'person' | string
  title?: string
  name?: string
  poster_path?: string | null
  backdrop_path?: string | null
  profile_path?: string | null
  vote_average?: number
  release_date?: string
  first_air_date?: string
  overview?: string
  [key: string]: any
}
