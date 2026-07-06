// ============================================================
//  영화 상세 (기존 movie-detail.html + detail.js 이식)
//  관람등급 · 어디서 볼 수 있나 · 줄거리/키워드 · 예고편 ·
//  출연진(인물 링크) · 추천작 · 비슷한 영화 · 리뷰 · 스틸컷
// ============================================================
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import MovieShell from './MovieShell'
import Row from '../../components/Row'
import MediaCard from '../../components/MediaCard'
import TrailerEmbed from '../../components/TrailerEmbed'
import { TMDBApi, pickYouTubeKey, type MediaItem } from '../../lib/tmdb'
import { img, profileImg, year, rating, certKR, certLabel } from '../../lib/format'
import { Favorites, emitFavChange } from '../../lib/favorites'
import { Recent } from '../../lib/recent'
import { useI18n, LangSelect } from '../../i18n'
import { useToast } from '../../components/Toast'

// ---------- 상영시간 "{h}시간 {m}분" ----------
function runtimeText(t: (k: string) => string, min?: number): string {
  if (!min) return ''
  const h = Math.floor(min / 60)
  const m = min % 60
  return h ? `${h}${t('hour')} ${m}${t('min')}` : `${m}${t('min')}`
}

// ---------- 관람등급 배지 ----------
function CertBadge({ movie }: { movie: any }) {
  const badge = certLabel(certKR(movie.release_dates))
  if (!badge) return null
  return <span className={`px-3 py-1 ${badge.cls} rounded-full font-bold`}>{badge.text}</span>
}

// ---------- 어디서 볼 수 있나 (KR) ----------
function dedupe(arr: any[]): any[] {
  const seen = new Set<number>()
  return (arr || []).filter((p) => (seen.has(p.provider_id) ? false : seen.add(p.provider_id)))
}

function ProviderGroup({ label, arr }: { label: string; arr: any[] }) {
  const items = dedupe(arr)
  if (!items.length) return null
  return (
    <div className="mb-3">
      <p className="text-sm text-gray-500 mb-2">{label}</p>
      <div className="flex flex-wrap gap-3">
        {items.map((p) => (
          <div key={p.provider_id} className="flex flex-col items-center w-16 text-center">
            <img
              src={img(p.logo_path, 'w92')}
              alt={p.provider_name}
              title={p.provider_name}
              className="w-12 h-12 rounded-xl object-cover shadow"
            />
            <span className="text-[11px] text-gray-500 mt-1 leading-tight">{p.provider_name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Providers({ movie }: { movie: any }) {
  const { t } = useI18n()
  const kr = movie['watch/providers']?.results?.KR
  if (!kr) return null
  const hasBody =
    dedupe(kr.flatrate).length || dedupe(kr.rent).length || dedupe(kr.buy).length
  if (!hasBody) return null
  return (
    <section className="mb-8 bg-white rounded-xl shadow p-5">
      <h3 className="text-xl font-bold text-gray-800 mb-3">
        📺 {t('sec_providers')}{' '}
        <span className="text-xs font-normal text-gray-400">({t('region_kr')})</span>
      </h3>
      <ProviderGroup label={'🔵 ' + t('prov_stream')} arr={kr.flatrate} />
      <ProviderGroup label={'💰 ' + t('prov_rent')} arr={kr.rent} />
      <ProviderGroup label={'🛒 ' + t('prov_buy')} arr={kr.buy} />
      {kr.link && (
        <a
          href={kr.link}
          target="_blank"
          rel="noopener"
          className="inline-block mt-1 text-sm text-indigo-600 hover:underline"
        >
          {t('prov_justwatch')}
        </a>
      )}
    </section>
  )
}

// ---------- 키워드 태그 ----------
function Keywords({ movie }: { movie: any }) {
  const kws = (movie.keywords?.keywords || []).slice(0, 12)
  if (!kws.length) return null
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {kws.map((k: any) => (
        <span key={k.id} className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
          # {k.name}
        </span>
      ))}
    </div>
  )
}

// ---------- 리뷰 한 건 (더보기/접기 클램프) ----------
function Review({ r }: { r: any }) {
  const { t } = useI18n()
  const rate = r.author_details?.rating
  const content: string = r.content || ''
  const long = content.length > 320
  const [clamped, setClamped] = useState(true)
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-gray-800">{r.author}</span>
        {rate && (
          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold">
            ⭐ {rate}
          </span>
        )}
      </div>
      <p
        className={`review-body text-gray-600 text-sm leading-relaxed ${long && clamped ? 'clamped' : ''}`}
      >
        {content}
      </p>
      {long && (
        <button
          type="button"
          className="review-more text-indigo-600 text-sm font-semibold mt-1"
          onClick={() => setClamped((c) => !c)}
        >
          {clamped ? t('more_btn') : t('less_btn')}
        </button>
      )}
    </div>
  )
}

function Reviews({ movie }: { movie: any }) {
  const { t } = useI18n()
  const list = (movie.reviews?.results || []).slice(0, 3)
  if (!list.length) return null
  return (
    <section className="mb-8">
      <h3 className="text-xl font-bold text-gray-800 mb-3">📝 {t('sec_reviews')}</h3>
      <div className="space-y-4">
        {list.map((r: any) => (
          <Review key={r.id} r={r} />
        ))}
      </div>
    </section>
  )
}

// ---------- 스틸컷 ----------
function Stills({ movie }: { movie: any }) {
  const { t } = useI18n()
  const stills = (movie.images?.backdrops || []).slice(0, 10)
  if (!stills.length) return null
  return (
    <section className="mb-8">
      <h3 className="text-xl font-bold text-gray-800 mb-3">🖼 {t('sec_stills')}</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 row-scroll">
        {stills.map((s: any, i: number) => (
          <a
            key={i}
            href={img(s.file_path, 'original')}
            target="_blank"
            rel="noopener"
            className="shrink-0"
          >
            <img
              src={img(s.file_path, 'w500')}
              alt="still"
              loading="lazy"
              className="h-40 rounded-lg object-cover shadow hover:opacity-90 transition"
            />
          </a>
        ))}
      </div>
    </section>
  )
}

// ---------- 상세 본문 ----------
function Detail({ movie }: { movie: any }) {
  const { t } = useI18n()
  const toast = useToast()

  const genres = (movie.genres || []).map((g: any) => g.name)
  const trailerKey = pickYouTubeKey(movie.videos)
  const cast = (movie.credits?.cast || []).slice(0, 20)
  const recommendations = (movie.recommendations?.results || [])
    .filter((m: MediaItem) => m.poster_path)
    .slice(0, 15)
  const similar = (movie.similar?.results || [])
    .filter((m: MediaItem) => m.poster_path)
    .slice(0, 15)

  const [isFav, setIsFav] = useState(() => Favorites.has(movie.id, 'movie'))

  const onFav = () => {
    const added = Favorites.toggle(movie, 'movie')
    setIsFav(added)
    emitFavChange()
    toast(added ? t('toast_added') : t('toast_removed'))
  }

  return (
    <>
      {/* 히어로: 배경 + 포스터 + 제목/메타 */}
      <div className="relative rounded-2xl overflow-hidden mb-8 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
          {movie.backdrop_path && (
            <img src={img(movie.backdrop_path, 'w1280')} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1015] via-[#0f1015]/85 to-[#0f1015]/25"></div>
        </div>
        <div className="relative flex flex-col sm:flex-row gap-6 p-6 sm:p-8">
          <img
            src={img(movie.poster_path)}
            alt={movie.title}
            className="w-40 sm:w-56 rounded-xl shadow-lg shrink-0 mx-auto sm:mx-0"
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900">
              {movie.title}{' '}
              <span className="text-gray-400 font-medium text-xl">{year(movie.release_date)}</span>
            </h2>
            {movie.original_title && movie.original_title !== movie.title && (
              <p className="text-gray-400 text-sm mt-1">{movie.original_title}</p>
            )}
            {movie.tagline && (
              <p className="text-indigo-600 font-semibold mt-1 italic">{movie.tagline}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-4 text-sm">
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-bold">
                ⭐ {rating(movie.vote_average)}
              </span>
              <CertBadge movie={movie} />
              {movie.runtime ? (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                  ⏱ {runtimeText(t, movie.runtime)}
                </span>
              ) : null}
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                🗳 {t('votes', { n: (movie.vote_count || 0).toLocaleString() })}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {genres.map((g: string) => (
                <span
                  key={g}
                  className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold"
                >
                  {g}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={onFav}
              className={`mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-lg font-bold min-h-[44px] transition ${
                isFav
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-white text-gray-800 border-2 border-gray-300 hover:border-red-400'
              }`}
            >
              <span>{isFav ? '❤️' : '🤍'}</span>
              <span>{isFav ? t('fav_done') : t('fav_do')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 어디서 볼 수 있나 */}
      <Providers movie={movie} />

      {/* 줄거리 + 키워드 */}
      {movie.overview && (
        <section className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-2">📖 {t('sec_overview')}</h3>
          <p className="text-gray-700 leading-relaxed">{movie.overview}</p>
          <Keywords movie={movie} />
        </section>
      )}

      {/* 예고편 */}
      {trailerKey && (
        <section className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-3">▶️ {t('sec_trailer')}</h3>
          <TrailerEmbed videoKey={trailerKey} />
        </section>
      )}

      {/* 출연진 */}
      {cast.length > 0 && (
        <section className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-3">
            🎭 {t('sec_cast')}{' '}
            <span className="text-xs font-normal text-gray-400">({t('cast_hint')})</span>
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-2 row-scroll">
            {cast.map((p: any) => (
              <Link key={p.id} to={`/person/${p.id}`} className="shrink-0 w-24 text-center group">
                <img
                  src={profileImg(p.profile_path, 'w185')}
                  alt={p.name}
                  loading="lazy"
                  className="w-24 h-24 rounded-full object-cover mx-auto shadow group-hover:ring-2 group-hover:ring-indigo-400 transition"
                />
                <p className="text-sm font-semibold text-gray-800 mt-2 leading-tight group-hover:text-indigo-600">
                  {p.name}
                </p>
                <p className="text-xs text-gray-500 leading-tight">{p.character || ''}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 추천작 */}
      {recommendations.length > 0 && (
        <Row title={'👍 ' + t('sec_rec_movie')}>
          {recommendations.map((m: MediaItem) => (
            <MediaCard key={m.id} item={m} />
          ))}
        </Row>
      )}

      {/* 비슷한 영화 */}
      {similar.length > 0 && (
        <Row title={'🎞 ' + t('sec_sim_movie')}>
          {similar.map((m: MediaItem) => (
            <MediaCard key={m.id} item={m} />
          ))}
        </Row>
      )}

      {/* 리뷰 */}
      <Reviews movie={movie} />

      {/* 스틸컷 */}
      <Stills movie={movie} />
    </>
  )
}

// ---------- 페이지 ----------
export default function MovieDetail() {
  const { t } = useI18n()
  const { id } = useParams<{ id: string }>()
  const [movie, setMovie] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError(t('err_load_movie'))
      return
    }
    let alive = true
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const data = await TMDBApi.detail(id)
        // 리뷰가 비면 별도 엔드포인트로 보강 (실패는 무시)
        if (!data.reviews?.results?.length) {
          try {
            data.reviews = await TMDBApi.reviews(id)
          } catch {
            /* 리뷰 실패는 무시 */
          }
        }
        if (!alive) return
        setMovie(data)
        setLoading(false)
        Recent.add(data, 'movie')
        document.title = `${data.title} · Coding Sister`
        window.scrollTo({ top: 0 })
      } catch (err: any) {
        if (!alive) return
        setLoading(false)
        setError(`${t('err_load_movie')} (${err.message})`)
      }
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return (
    <MovieShell>
      {/* 헤더 */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center gap-3">
            <Link
              to="/movie"
              className="px-3 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition font-semibold text-sm min-h-[44px] flex items-center"
            >
              {t('movie_home')}
            </Link>
            <div className="flex items-center gap-2">
              <LangSelect />
              <Link to="/movie" className="text-xl sm:text-2xl font-bold text-indigo-600 shrink-0">
                🎬<span className="hidden sm:inline"> Coding Sister</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="text-center py-20 text-gray-400 animate-pulse">{t('loading')}</div>
        ) : error || !movie ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">😵</div>
            <p className="text-lg font-bold text-gray-700">{error || t('err_load_movie')}</p>
            <Link
              to="/movie"
              className="inline-block mt-5 px-5 py-3 bg-indigo-600 text-white rounded-lg font-semibold"
            >
              ← {t('home_btn')}
            </Link>
          </div>
        ) : (
          <Detail movie={movie} />
        )}
      </main>

      <footer className="text-center text-gray-400 text-sm py-8">
        <span>{t('footer_data')}</span>{' '}
        <a
          href="https://www.themoviedb.org/"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-indigo-500"
        >
          TMDB
        </a>
      </footer>
    </MovieShell>
  )
}
