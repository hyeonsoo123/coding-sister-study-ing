// ============================================================
//  TV 시리즈 상세 (기존 tv-detail.html + tv-detail.js 이식)
//  방영등급 · 시즌/화수 · 제공처 · 줄거리/키워드 · 예고편 ·
//  출연진(인물 링크) · 추천/비슷한 시리즈 · 리뷰 · 스틸컷
// ============================================================
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import MovieShell from './MovieShell'
import Row from '../../components/Row'
import MediaCard from '../../components/MediaCard'
import TrailerEmbed from '../../components/TrailerEmbed'
import { TMDBApi, pickYouTubeKey, type MediaItem } from '../../lib/tmdb'
import { img, profileImg, year, rating, certLabel } from '../../lib/format'
import { Favorites, emitFavChange } from '../../lib/favorites'
import { Recent } from '../../lib/recent'
import { useI18n, LangSelect } from '../../i18n'
import { useToast } from '../../components/Toast'

const STATUS_KEY: Record<string, string> = {
  'Returning Series': 'st_returning',
  Ended: 'st_ended',
  Canceled: 'st_canceled',
  'In Production': 'st_production',
  Planned: 'st_planned',
  Pilot: 'st_pilot',
}

// ---------- 리뷰 한 개 (긴 글은 접기/펼치기) ----------
function ReviewItem({ review }: { review: any }) {
  const { t } = useI18n()
  const content: string = review.content || ''
  const long = content.length > 320
  const [clamped, setClamped] = useState(true)
  const r = review.author_details?.rating
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-gray-800">{review.author}</span>
        {r ? (
          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold">⭐ {r}</span>
        ) : null}
      </div>
      <p className={`review-body text-gray-600 text-sm leading-relaxed ${long && clamped ? 'clamped' : ''}`}>{content}</p>
      {long ? (
        <button
          type="button"
          className="review-more text-indigo-600 text-sm font-semibold mt-1"
          onClick={() => setClamped((c) => !c)}
        >
          {clamped ? t('more_btn') : t('less_btn')}
        </button>
      ) : null}
    </div>
  )
}

export default function TvDetail() {
  const { id } = useParams<{ id: string }>()
  const { t } = useI18n()
  const toast = useToast()

  const [show, setShow] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFav, setIsFav] = useState(false)

  // 회당 러닝타임 텍스트
  const runtimeText = (min?: number) => {
    if (!min) return ''
    const h = Math.floor(min / 60)
    const m = min % 60
    return h ? `${h}${t('hour')} ${m}${t('min')}` : `${m}${t('min')}`
  }

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError(t('err_bad'))
      return
    }
    let alive = true
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const data: any = await TMDBApi.tvDetail(id)
        if (!data.reviews?.results?.length) {
          try {
            data.reviews = await TMDBApi.tvReviews(id)
          } catch {
            /* 리뷰 실패는 무시 */
          }
        }
        if (!alive) return
        setShow(data)
        setIsFav(Favorites.has(data.id, 'tv'))
        Recent.add(data, 'tv')
        document.title = `${data.name} · Coding Sister`
        window.scrollTo({ top: 0 })
      } catch (err: any) {
        if (alive) setError(`${t('err_load_tv')} (${err.message})`)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const Header = () => (
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
  )

  const Footer = () => (
    <footer className="text-center text-gray-400 text-sm py-8">
      <span>{t('footer_data')}</span>{' '}
      <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" className="underline hover:text-indigo-500">
        TMDB
      </a>
    </footer>
  )

  // ---------- 로딩 / 에러 ----------
  if (loading) {
    return (
      <MovieShell>
        <Header />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center py-20 text-gray-400 animate-pulse">{t('loading')}</div>
        </main>
        <Footer />
      </MovieShell>
    )
  }

  if (error || !show) {
    return (
      <MovieShell>
        <Header />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center py-20">
            <div className="text-6xl mb-4">😵</div>
            <p className="text-lg font-bold text-gray-700">{error || t('err_load_tv')}</p>
            <Link to="/movie" className="inline-block mt-5 px-5 py-3 bg-indigo-600 text-white rounded-lg font-semibold">
              ← {t('home_btn')}
            </Link>
          </div>
        </main>
        <Footer />
      </MovieShell>
    )
  }

  // ---------- 데이터 가공 ----------
  const genres: string[] = (show.genres || []).map((g: any) => g.name)
  const trailerKey = pickYouTubeKey(show.videos)
  const cast: any[] = (show.aggregate_credits?.cast || []).slice(0, 20)
  const recommendations: MediaItem[] = (show.recommendations?.results || [])
    .filter((m: any) => m.poster_path)
    .slice(0, 15)
  const similar: MediaItem[] = (show.similar?.results || []).filter((m: any) => m.poster_path).slice(0, 15)
  const runtime = Array.isArray(show.episode_run_time) ? show.episode_run_time[0] : show.episode_run_time
  const networks: string[] = (show.networks || []).map((n: any) => n.name).filter(Boolean)
  const creators: string[] = (show.created_by || []).map((c: any) => c.name).filter(Boolean)
  const statusLabel = STATUS_KEY[show.status] ? t(STATUS_KEY[show.status]) : show.status

  const krRating = (show.content_ratings?.results || []).find((r: any) => r.iso_3166_1 === 'KR')
  const certBadge = certLabel(krRating?.rating)

  const keywords: any[] = (show.keywords?.results || []).slice(0, 12)
  const kr = show['watch/providers']?.results?.KR
  const dedupe = (arr: any[]) => {
    const seen = new Set<number>()
    return (arr || []).filter((p) => (seen.has(p.provider_id) ? false : seen.add(p.provider_id)))
  }
  const provGroups: { label: string; items: any[] }[] = kr
    ? [
        { label: '🔵 ' + t('prov_stream'), items: dedupe(kr.flatrate) },
        { label: '💰 ' + t('prov_rent'), items: dedupe(kr.rent) },
        { label: '🛒 ' + t('prov_buy'), items: dedupe(kr.buy) },
      ].filter((g) => g.items.length)
    : []
  const reviews: any[] = (show.reviews?.results || []).slice(0, 3)
  const stills: any[] = (show.images?.backdrops || []).slice(0, 10)

  const onFav = () => {
    const added = Favorites.toggle(show, 'tv')
    setIsFav(added)
    emitFavChange()
    toast(added ? t('toast_added') : t('toast_removed'))
  }

  return (
    <MovieShell>
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 헤더 (배경 + 포스터 + 정보) */}
        <div className="relative rounded-2xl overflow-hidden mb-8 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
            {show.backdrop_path && (
              <img src={img(show.backdrop_path, 'w1280')} alt="" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1015] via-[#0f1015]/85 to-[#0f1015]/25"></div>
          </div>
          <div className="relative flex flex-col sm:flex-row gap-6 p-6 sm:p-8">
            <img
              src={img(show.poster_path)}
              alt={show.name}
              className="w-40 sm:w-56 rounded-xl shadow-lg shrink-0 mx-auto sm:mx-0"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl sm:text-4xl font-bold text-gray-900">
                {show.name}
                <span className="text-gray-400 font-medium text-xl"> {year(show.first_air_date)}</span>
                <span className="align-middle ml-1 px-2 py-0.5 bg-indigo-600 text-white text-xs font-extrabold rounded">
                  TV
                </span>
              </h2>
              {show.original_name && show.original_name !== show.name && (
                <p className="text-gray-400 text-sm mt-1">{show.original_name}</p>
              )}
              {show.tagline && <p className="text-indigo-600 font-semibold mt-1 italic">{show.tagline}</p>}
              <div className="flex flex-wrap items-center gap-2 mt-4 text-sm">
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-bold">
                  ⭐ {rating(show.vote_average)}
                </span>
                {certBadge && (
                  <span className={`px-3 py-1 ${certBadge.cls} rounded-full font-bold`}>{certBadge.text}</span>
                )}
                {show.number_of_seasons ? (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                    📚 {t('seasons', { s: show.number_of_seasons, e: show.number_of_episodes || '?' })}
                  </span>
                ) : null}
                {runtime ? (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                    ⏱ {t('per_ep', { t: runtimeText(runtime) })}
                  </span>
                ) : null}
                {statusLabel && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">{statusLabel}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {genres.map((g) => (
                  <span
                    key={g}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold"
                  >
                    {g}
                  </span>
                ))}
              </div>
              {networks.length ? (
                <p className="text-sm text-gray-500 mt-3">
                  📡 {t('ch_label')}: {networks.join(', ')}
                </p>
              ) : null}
              {creators.length ? (
                <p className="text-sm text-gray-500 mt-1">
                  ✍️ {t('creator_label')}: {creators.join(', ')}
                </p>
              ) : null}
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

        {/* 제공처 */}
        {provGroups.length > 0 && (
          <section className="mb-8 bg-white rounded-xl shadow p-5">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              📺 {t('sec_providers')}{' '}
              <span className="text-xs font-normal text-gray-400">({t('region_kr')})</span>
            </h3>
            {provGroups.map((g) => (
              <div className="mb-3" key={g.label}>
                <p className="text-sm text-gray-500 mb-2">{g.label}</p>
                <div className="flex flex-wrap gap-3">
                  {g.items.map((p) => (
                    <div className="flex flex-col items-center w-16 text-center" key={p.provider_id}>
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
            ))}
            {kr?.link && (
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
        )}

        {/* 줄거리 + 키워드 */}
        {show.overview && (
          <section className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-2">📖 {t('sec_overview')}</h3>
            <p className="text-gray-700 leading-relaxed">{show.overview}</p>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {keywords.map((k) => (
                  <span key={k.id} className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
                    # {k.name}
                  </span>
                ))}
              </div>
            )}
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
              🎭 {t('sec_cast')} <span className="text-xs font-normal text-gray-400">({t('cast_hint')})</span>
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-2 row-scroll">
              {cast.map((p) => {
                const character = p.roles?.[0]?.character || ''
                return (
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
                    <p className="text-xs text-gray-500 leading-tight">{character}</p>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* 추천 시리즈 */}
        {recommendations.length > 0 && (
          <Row title={'👍 ' + t('sec_rec_tv')}>
            {recommendations.map((m) => (
              <MediaCard key={`${m.media_type || 'tv'}${m.id}`} item={m} />
            ))}
          </Row>
        )}

        {/* 비슷한 시리즈 */}
        {similar.length > 0 && (
          <Row title={'🎞 ' + t('sec_sim_tv')}>
            {similar.map((m) => (
              <MediaCard key={`${m.media_type || 'tv'}${m.id}`} item={m} />
            ))}
          </Row>
        )}

        {/* 리뷰 */}
        {reviews.length > 0 && (
          <section className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-3">📝 {t('sec_reviews')}</h3>
            <div className="space-y-4">
              {reviews.map((r) => (
                <ReviewItem key={r.id} review={r} />
              ))}
            </div>
          </section>
        )}

        {/* 스틸컷 */}
        {stills.length > 0 && (
          <section className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-3">🖼 {t('sec_stills')}</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 row-scroll">
              {stills.map((s, i) => (
                <a key={i} href={img(s.file_path, 'original')} target="_blank" rel="noopener" className="shrink-0">
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
        )}
      </main>
      <Footer />
    </MovieShell>
  )
}
