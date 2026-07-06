// ============================================================
//  영화 홈 (기존 movie.html + home.js 이식)
//  홈 / 시리즈(TV) / 탐색(필터) / 검색 / 내 찜 + 히어로 빌보드
// ============================================================
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import MovieShell from './MovieShell'
import Row, { SkeletonCards, SkeletonGrid, EmptyState } from '../../components/Row'
import MediaCard from '../../components/MediaCard'
import { TMDBApi, pickYouTubeKey, type MediaItem } from '../../lib/tmdb'
import { img, rating, year } from '../../lib/format'
import { Favorites, emitFavChange } from '../../lib/favorites'
import { Recent } from '../../lib/recent'
import { useI18n, LangSelect } from '../../i18n'
import { useToast } from '../../components/Toast'
import { useTrailer } from '../../components/Trailer'

type View = 'home' | 'tv' | 'browse' | 'search' | 'fav'

// ---------- 홈/TV 가로 줄: 로드하고 결과 없으면 스스로 숨김 ----------
function AsyncRow({ title, load }: { title: string; load: () => Promise<any> }) {
  const { t } = useI18n()
  const [state, setState] = useState<{ loading: boolean; items: MediaItem[]; err?: string; hide: boolean }>({
    loading: true,
    items: [],
    hide: false,
  })
  useEffect(() => {
    let alive = true
    load()
      .then((data) => {
        if (!alive) return
        const items = (data.results || []).filter((m: MediaItem) => m.poster_path)
        if (!items.length) setState({ loading: false, items: [], hide: true })
        else setState({ loading: false, items, hide: false })
      })
      .catch((err) => alive && setState({ loading: false, items: [], hide: false, err: err.message }))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (state.hide) return null
  return (
    <Row title={title}>
      {state.loading ? (
        <SkeletonCards n={6} />
      ) : state.err ? (
        <p className="text-red-500 text-sm py-8">
          {t('load_fail')}: {state.err}
        </p>
      ) : (
        state.items.map((m) => <MediaCard key={`${m.media_type || ''}${m.id}`} item={m} />)
      )}
    </Row>
  )
}

// 이미 가진 데이터로 고정 줄 (최근 본 작품)
function StaticRow({ title, items }: { title: string; items: MediaItem[] }) {
  const list = items.filter((m) => m.poster_path)
  if (!list.length) return null
  return (
    <Row title={title}>
      {list.map((m) => (
        <MediaCard key={`${m.media_type || ''}${m.id}`} item={m} />
      ))}
    </Row>
  )
}

// ---------- 히어로 빌보드 ----------
function Hero() {
  const { t } = useI18n()
  const toast = useToast()
  const playTrailer = useTrailer()
  const [items, setItems] = useState<MediaItem[]>([])
  const [idx, setIdx] = useState(0)
  const [faved, setFaved] = useState(false)
  const [imgSrc, setImgSrc] = useState('')
  const [imgVisible, setImgVisible] = useState(false)
  const slideRef = useRef<HTMLDivElement>(null)
  const infoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    TMDBApi.trending()
      .then((data) => {
        if (!alive) return
        const list = (data.results || [])
          .filter((m: MediaItem) => m.backdrop_path && m.overview)
          .slice(0, 5)
        setItems(list)
      })
      .catch(() => setItems([]))
    return () => {
      alive = false
    }
  }, [])

  const render = useCallback(
    (i: number) => {
      if (!items.length) return
      const next = (i + items.length) % items.length
      setIdx(next)
    },
    [items.length],
  )

  // 배경 이미지 프리로드 후 페이드
  useEffect(() => {
    const m = items[idx]
    if (!m) return
    setImgVisible(false)
    const pre = new Image()
    pre.onload = () => {
      setImgSrc(pre.src)
      setImgVisible(true)
    }
    pre.src = img(m.backdrop_path, 'w1280')
    setFaved(Favorites.has(m.id, 'movie'))
  }, [items, idx])

  // 찜 동기화
  useEffect(() => {
    const onFav = () => {
      const m = items[idx]
      if (m) setFaved(Favorites.has(m.id, 'movie'))
    }
    document.addEventListener('favchange', onFav)
    return () => document.removeEventListener('favchange', onFav)
  }, [items, idx])

  // 스와이프/드래그
  useEffect(() => {
    const hero = document.getElementById('hero')
    const slide = slideRef.current
    const info = infoRef.current
    if (!hero || !slide || !info) return
    const RESIST = 0.4
    let startX: number | null = null
    let dx = 0
    const shift = (px: number) => {
      slide.style.transform = `translateX(${px}px)`
      info.style.transform = `translateX(${px}px)`
    }
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('input, button, a, #heroDots')) return
      startX = e.clientX
      dx = 0
      slide.style.transition = 'none'
      info.style.transition = 'none'
    }
    const onMove = (e: PointerEvent) => {
      if (startX === null) return
      dx = e.clientX - startX
      shift(dx * RESIST)
    }
    const end = () => {
      if (startX === null) return
      const moved = dx
      startX = null
      slide.style.transition = 'transform 0.3s ease'
      info.style.transition = 'transform 0.3s ease'
      shift(0)
      if (Math.abs(moved) > 60) render(idx + (moved < 0 ? 1 : -1))
    }
    hero.addEventListener('pointerdown', onDown)
    hero.addEventListener('pointermove', onMove)
    hero.addEventListener('pointerup', end)
    hero.addEventListener('pointercancel', end)
    return () => {
      hero.removeEventListener('pointerdown', onDown)
      hero.removeEventListener('pointermove', onMove)
      hero.removeEventListener('pointerup', end)
      hero.removeEventListener('pointercancel', end)
    }
  }, [idx, render])

  const playHeroTrailer = async () => {
    const m = items[idx]
    if (!m) return
    try {
      let key = pickYouTubeKey(await TMDBApi.movieVideos(m.id))
      if (!key) key = pickYouTubeKey(await TMDBApi.get(`/movie/${m.id}/videos`, { language: 'en-US' }))
      if (key) playTrailer(key)
      else toast(t('no_trailer'))
    } catch {
      toast(t('no_trailer'))
    }
  }

  const onFav = () => {
    const m = items[idx]
    if (!m) return
    const added = Favorites.toggle(m, 'movie')
    setFaved(added)
    toast(added ? t('toast_added') : t('toast_removed'))
    emitFavChange()
  }

  if (!items.length) return null
  const m = items[idx]
  const detailHref = `/movie/${m.id}`

  return (
    <section id="hero" className="relative w-full overflow-hidden bg-gray-900">
      <div id="heroSlide" ref={slideRef} className="absolute inset-0">
        <img
          id="heroImg"
          src={imgSrc}
          alt=""
          className="w-full h-full object-cover object-top transition-opacity duration-500"
          style={{ opacity: imgVisible ? 1 : 0 }}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />

      <div className="relative max-w-7xl mx-auto min-h-[360px] sm:min-h-[460px] px-4 sm:px-6 lg:px-8 flex flex-col justify-between gap-6 py-6 sm:py-7">
        <div id="heroInfo" ref={infoRef} className="max-w-2xl text-white mt-auto">
          <Link to={detailHref} className="inline-block">
            <h2 className="text-2xl sm:text-5xl font-extrabold drop-shadow-lg leading-tight transition-opacity hover:opacity-80">
              {m.title || m.name}
            </h2>
          </Link>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
            <span className="font-bold text-yellow-400">⭐ {rating(m.vote_average)}</span>
            <span className="text-gray-300">·</span>
            <span className="text-gray-200">{year(m.release_date)}</span>
          </div>
          <p
            className="mt-2 text-sm sm:text-base text-gray-200 drop-shadow max-w-xl"
            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {m.overview || ''}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              type="button"
              onClick={playHeroTrailer}
              className="px-5 py-2.5 bg-indigo-500 text-white rounded-lg font-bold hover:bg-indigo-400 transition min-h-[44px] inline-flex items-center gap-1"
            >
              ▶ <span>{t('sec_trailer')}</span>
            </button>
            <Link
              to={detailHref}
              className="px-5 py-2.5 bg-white/25 text-white rounded-lg font-bold backdrop-blur hover:bg-white/35 transition min-h-[44px] inline-flex items-center gap-1"
            >
              ℹ <span>{t('hero_detail')}</span>
            </Link>
            <button
              type="button"
              aria-label="favorite"
              onClick={onFav}
              className="px-4 py-2.5 bg-white/25 text-white rounded-lg font-bold backdrop-blur hover:bg-white/35 transition min-h-[44px]"
            >
              {faved ? '❤️' : '🤍'}
            </button>
          </div>
        </div>

        <button
          type="button"
          aria-label="prev"
          onClick={() => render(idx - 1)}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white text-2xl hidden sm:flex items-center justify-center"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="next"
          onClick={() => render(idx + 1)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white text-2xl hidden sm:flex items-center justify-center"
        >
          ›
        </button>
        <div id="heroDots" className="absolute bottom-3 right-4 flex gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={String(i + 1)}
              onClick={() => render(i)}
              className={`hero-dot w-2.5 h-2.5 rounded-full transition ${i === idx ? 'bg-white' : 'bg-white/50'}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------- 검색 뷰 ----------
function SearchView({ active, query }: { active: boolean; query: string }) {
  const { t } = useI18n()
  const toast = useToast()
  const [items, setItems] = useState<MediaItem[]>([])
  const [heading, setHeading] = useState('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const moreRef = useRef<HTMLButtonElement>(null)
  const loadingRef = useRef(false)

  const run = useCallback(
    async (q: string, p: number, reset: boolean) => {
      if (reset) {
        setLoading(true)
        setHeading(t('search_searching', { q }))
      }
      try {
        const data = await TMDBApi.searchMulti(q, p)
        setTotalPages(data.total_pages || 1)
        const found = (data.results || []).filter(
          (m: MediaItem) => (m.media_type === 'movie' || m.media_type === 'tv') && m.poster_path,
        )
        setItems((prev) => (reset ? found : [...prev, ...found]))
        if (reset) {
          setHeading(
            t('search_results', {
              q,
              n: (data.total_results || found.length).toLocaleString(),
            }),
          )
        }
      } catch (err: any) {
        if (reset) {
          setHeading(t('search_fail'))
          setItems([])
        } else {
          toast(`${t('toast_more_fail')}: ${err.message}`)
        }
      } finally {
        if (reset) setLoading(false)
      }
    },
    [t, toast],
  )

  // 새 검색어
  useEffect(() => {
    if (!query) return
    setPage(1)
    run(query, 1, true)
  }, [query, run])

  const loadMore = useCallback(() => {
    if (loadingRef.current || page >= totalPages) return
    loadingRef.current = true
    const next = page + 1
    setPage(next)
    Promise.resolve(run(query, next, false)).finally(() => (loadingRef.current = false))
  }, [page, totalPages, query, run])

  // 무한 스크롤
  useEffect(() => {
    if (!active) return
    const btn = moreRef.current
    if (!btn) return
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && loadMore()),
      { rootMargin: '600px' },
    )
    io.observe(btn)
    return () => io.disconnect()
  }, [active, loadMore])

  return (
    <div className={active ? '' : 'hidden'}>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">{heading}</h2>
      <div className="movie-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {loading ? (
          <SkeletonGrid n={12} />
        ) : items.length ? (
          items.map((m) => <MediaCard key={`${m.media_type}${m.id}`} item={m} />)
        ) : (
          heading && <EmptyState emoji="🔍" title={t('empty_search_t')} desc={t('empty_search_d')} />
        )}
      </div>
      <div className="text-center mt-6">
        <button
          ref={moreRef}
          onClick={loadMore}
          className={`${page >= totalPages ? 'hidden' : ''} px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold min-h-[44px]`}
        >
          {t('more')}
        </button>
      </div>
    </div>
  )
}

// ---------- 탐색(Browse) 뷰 ----------
function BrowseView({ active }: { active: boolean }) {
  const { t } = useI18n()
  const toast = useToast()
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [sort, setSort] = useState('popularity.desc')
  const [minRating, setMinRating] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loaded, setLoaded] = useState(false)
  const moreRef = useRef<HTMLButtonElement>(null)
  const loadingRef = useRef(false)
  // 적용된 필터 (적용 버튼 눌렀을 때만 갱신)
  const applied = useRef({ sort: 'popularity.desc', minRating: '', year: '', genres: new Set<number>() })

  const buildParams = (p: number) => {
    const a = applied.current
    const params: Record<string, any> = { sort_by: a.sort, page: p }
    if (a.genres.size) params.with_genres = [...a.genres].join(',')
    if (a.minRating) params['vote_average.gte'] = a.minRating
    if (a.year) params.primary_release_year = a.year
    if (a.sort === 'vote_average.desc') params['vote_count.gte'] = 200
    return params
  }

  const run = useCallback(
    async (p: number, reset: boolean) => {
      if (reset) setLoading(true)
      try {
        const data = await TMDBApi.discover(buildParams(p))
        setTotalPages(data.total_pages || 1)
        const movies = (data.results || []).filter((m: MediaItem) => m.poster_path)
        setItems((prev) => (reset ? movies : [...prev, ...movies]))
      } catch (err: any) {
        if (reset) setItems([])
        else toast(`${t('toast_more_fail')}: ${err.message}`)
      } finally {
        if (reset) setLoading(false)
      }
    },
    [t, toast],
  )

  // 첫 활성화 시 장르 로드 + 기본 결과
  useEffect(() => {
    if (!active || loaded) return
    setLoaded(true)
    TMDBApi.genres()
      .then((data) => setGenres(data.genres || []))
      .catch(() => setGenres([]))
    run(1, true)
  }, [active, loaded, run])

  const apply = () => {
    applied.current = { sort, minRating, year: yearFilter, genres: new Set(selected) }
    setPage(1)
    run(1, true)
  }
  const reset = () => {
    setSelected(new Set())
    setSort('popularity.desc')
    setMinRating('')
    setYearFilter('')
    applied.current = { sort: 'popularity.desc', minRating: '', year: '', genres: new Set() }
    setPage(1)
    run(1, true)
  }
  const toggleGenre = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const loadMore = useCallback(() => {
    if (loadingRef.current || page >= totalPages) return
    loadingRef.current = true
    const next = page + 1
    setPage(next)
    Promise.resolve(run(next, false)).finally(() => (loadingRef.current = false))
  }, [page, totalPages, run])

  useEffect(() => {
    if (!active) return
    const btn = moreRef.current
    if (!btn) return
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && loadMore()),
      { rootMargin: '600px' },
    )
    io.observe(btn)
    return () => io.disconnect()
  }, [active, loadMore])

  return (
    <div className={active ? '' : 'hidden'}>
      <div className="bg-white rounded-xl shadow p-4 sm:p-5 mb-6">
        <p className="text-sm font-semibold text-gray-700 mb-2">{t('f_genre')}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {genres.length ? (
            genres.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGenre(g.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition min-h-[40px] ${
                  selected.has(g.id) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {g.name}
              </button>
            ))
          ) : (
            <span className="text-gray-400 text-sm">{t('genre_loading')}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <label className="text-sm">
            <span className="block text-gray-500 mb-1">{t('f_sort')}</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 min-h-[44px]"
            >
              <option value="popularity.desc">{t('sort_pop')}</option>
              <option value="vote_average.desc">{t('sort_rating')}</option>
              <option value="primary_release_date.desc">{t('sort_new')}</option>
              <option value="revenue.desc">{t('sort_revenue')}</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="block text-gray-500 mb-1">{t('f_rating')}</span>
            <select
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 min-h-[44px]"
            >
              <option value="">{t('rating_all')}</option>
              <option value="5">5+</option>
              <option value="6">6+</option>
              <option value="7">7+</option>
              <option value="8">8+</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="block text-gray-500 mb-1">{t('f_year')}</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder={t('year_ph')}
              min={1900}
              max={2100}
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-28 px-3 py-2 rounded-lg border border-gray-300 min-h-[44px]"
            />
          </label>
          <button onClick={apply} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold min-h-[44px]">
            {t('f_apply')}
          </button>
          <button onClick={reset} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition font-semibold min-h-[44px]">
            {t('f_reset')}
          </button>
        </div>
      </div>
      <div className="movie-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {loading ? (
          <SkeletonGrid n={12} />
        ) : items.length ? (
          items.map((m) => <MediaCard key={`${m.media_type || 'movie'}${m.id}`} item={m} />)
        ) : (
          <EmptyState emoji="🎬" title={t('empty_browse_t')} desc={t('empty_browse_d')} />
        )}
      </div>
      <div className="text-center mt-6">
        <button
          ref={moreRef}
          onClick={loadMore}
          className={`${page >= totalPages ? 'hidden' : ''} px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold min-h-[44px]`}
        >
          {t('more')}
        </button>
      </div>
    </div>
  )
}

// ---------- 내 찜 뷰 ----------
function FavView({ active }: { active: boolean }) {
  const { t } = useI18n()
  const [list, setList] = useState<MediaItem[]>(() => Favorites.all() as MediaItem[])
  useEffect(() => {
    const refresh = () => setList(Favorites.all() as MediaItem[])
    document.addEventListener('favchange', refresh)
    return () => document.removeEventListener('favchange', refresh)
  }, [])
  useEffect(() => {
    if (active) setList(Favorites.all() as MediaItem[])
  }, [active])

  return (
    <div className={active ? '' : 'hidden'}>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
        ❤️ <span>{t('fav_heading')}</span>
      </h2>
      <div className="movie-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {list.length ? (
          list.map((m) => <MediaCard key={`${m.media_type}${m.id}`} item={m} />)
        ) : (
          <EmptyState emoji="🤍" title={t('empty_fav_t')} desc={t('empty_fav_d')} />
        )}
      </div>
    </div>
  )
}

// ---------- 홈 뷰 (개인화 줄 + 고정 줄) ----------
function HomeView({ active }: { active: boolean }) {
  const { t } = useI18n()
  const recent = Recent.all() as MediaItem[]
  const favs = Favorites.all()
  const rows = [
    { title: '🔥 ' + t('row_popular'), load: () => TMDBApi.popular() },
    { title: '🎬 ' + t('row_now'), load: () => TMDBApi.nowPlaying() },
    { title: '🗓 ' + t('row_upcoming'), load: () => TMDBApi.upcoming() },
    { title: '📈 ' + t('row_trend'), load: () => TMDBApi.trending() },
    { title: '⭐ ' + t('row_top'), load: () => TMDBApi.topRated() },
    { title: '💥 ' + t('row_action'), load: () => TMDBApi.byGenre(28) },
    { title: '😂 ' + t('row_comedy'), load: () => TMDBApi.byGenre(35) },
    { title: '👻 ' + t('row_horror'), load: () => TMDBApi.byGenre(27) },
    { title: '🎈 ' + t('row_anim'), load: () => TMDBApi.byGenre(16) },
  ]
  return (
    <div className={active ? '' : 'hidden'}>
      {recent.length > 0 && <StaticRow title={'🕘 ' + t('row_recent')} items={recent} />}
      {favs.length > 0 && (
        <AsyncRow
          title={'❤️ ' + t('row_because', { title: favs[0].title || '' })}
          load={() => TMDBApi.recommendations(favs[0].media_type || 'movie', favs[0].id)}
        />
      )}
      {rows.map((r) => (
        <AsyncRow key={r.title} title={r.title} load={r.load} />
      ))}
    </div>
  )
}

function TvView({ active }: { active: boolean }) {
  const { t } = useI18n()
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    if (active) setLoaded(true)
  }, [active])
  const rows = [
    { title: '🔥 ' + t('tv_popular'), load: () => TMDBApi.tvPopular() },
    { title: '📡 ' + t('tv_onair'), load: () => TMDBApi.tvOnTheAir() },
    { title: '📈 ' + t('tv_trend'), load: () => TMDBApi.tvTrending() },
    { title: '⭐ ' + t('tv_top'), load: () => TMDBApi.tvTopRated() },
    { title: '🎭 ' + t('tv_drama'), load: () => TMDBApi.tvByGenre(18) },
    { title: '😂 ' + t('row_comedy'), load: () => TMDBApi.tvByGenre(35) },
    { title: '💥 ' + t('tv_action_adv'), load: () => TMDBApi.tvByGenre(10759) },
    { title: '🚀 ' + t('tv_scifi'), load: () => TMDBApi.tvByGenre(10765) },
    { title: '🎈 ' + t('row_anim'), load: () => TMDBApi.tvByGenre(16) },
  ]
  return (
    <div className={active ? '' : 'hidden'}>
      {loaded && rows.map((r) => <AsyncRow key={r.title} title={r.title} load={r.load} />)}
    </div>
  )
}

// ---------- 페이지 ----------
export default function MovieHome() {
  const { t } = useI18n()
  const [view, setView] = useState<View>('home')
  const [query, setQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [favCount, setFavCount] = useState(Favorites.count())
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onFav = () => setFavCount(Favorites.count())
    document.addEventListener('favchange', onFav)
    return () => document.removeEventListener('favchange', onFav)
  }, [])

  const changeView = (v: View) => {
    setView(v)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchInput.trim()
    if (!q) return
    setQuery(q)
    changeView('search')
  }

  const tabs: { key: View; label: string; icon: string }[] = [
    { key: 'home', label: t('nav_home'), icon: '🏠' },
    { key: 'tv', label: t('nav_series'), icon: '📺' },
    { key: 'browse', label: t('nav_browse'), icon: '🎛' },
    { key: 'fav', label: t('nav_fav'), icon: '❤️' },
  ]

  return (
    <MovieShell>
      {/* 헤더 */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative">
          <div className="flex justify-between items-center gap-3">
            <Link to="/movie" className="text-xl sm:text-2xl font-bold text-indigo-600 shrink-0">
              🎬<span className="hidden sm:inline"> Coding Sister 영화</span>
            </Link>
            <button
              type="button"
              aria-label="menu"
              onClick={() => setMenuOpen((o) => !o)}
              className="sm:hidden px-3 py-2 bg-indigo-100 text-indigo-600 rounded-lg min-h-[44px] text-xl leading-none"
            >
              ☰
            </button>
            <div
              className={`${menuOpen ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row items-stretch sm:items-center gap-2 absolute sm:static top-full right-4 sm:right-auto mt-2 sm:mt-0 p-3 sm:p-0 rounded-xl sm:rounded-none bg-[#16171d] sm:bg-transparent border border-white/10 sm:border-0 shadow-xl sm:shadow-none z-50`}
            >
              <LangSelect />
              <Link to="/about" className="px-3 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition font-semibold text-sm min-h-[44px] flex items-center">
                👤 <span className="ml-1">{t('header_about')}</span>
              </Link>
              <Link to="/" className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-sm min-h-[44px] flex items-center">
                📅 <span className="ml-1">TODO</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <Hero />

      {/* 서브 내비 */}
      <div className="bg-white/80 backdrop-blur sticky top-[76px] z-40 border-b border-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex gap-2 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => changeView(tab.key)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm min-h-[44px] transition relative ${
                  view === tab.key ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'
                }`}
              >
                {tab.icon} <span>{tab.label}</span>
                {tab.key === 'fav' && favCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {favCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 검색 폼 (히어로 안이 아니라 상단 고정 대신 서브내비 아래에 배치) */}
        <form onSubmit={onSearch} className="w-full sm:max-w-2xl mx-auto mb-6">
          <div className="relative">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('search_ph')}
              className="w-full pl-5 pr-14 py-3 rounded-full bg-white shadow focus:ring-2 focus:ring-indigo-300 outline-none min-h-[48px]"
            />
            <button
              type="submit"
              aria-label="search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition"
            >
              🔍
            </button>
          </div>
        </form>

        <HomeView active={view === 'home'} />
        <TvView active={view === 'tv'} />
        <BrowseView active={view === 'browse'} />
        <SearchView active={view === 'search'} query={query} />
        <FavView active={view === 'fav'} />
      </main>

      <footer className="text-center text-gray-400 text-sm py-8">
        <span>{t('footer_data')}</span>{' '}
        <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" className="underline hover:text-indigo-500">
          TMDB
        </a>
      </footer>
    </MovieShell>
  )
}
