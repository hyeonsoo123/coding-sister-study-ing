// 영화/TV 겸용 포스터 카드 (기존 UI.mediaCard 이식)
// 링크=상세 페이지, 우상단 하트로 찜 토글
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { img, rating, year } from '../lib/format'
import { Favorites, emitFavChange } from '../lib/favorites'
import type { MediaItem } from '../lib/tmdb'
import { useToast } from './Toast'
import { useI18n } from '../i18n'

export default function MediaCard({ item }: { item: MediaItem }) {
  const toast = useToast()
  const { t } = useI18n()

  const type: 'movie' | 'tv' =
    item.media_type === 'tv' || item.media_type === 'movie'
      ? (item.media_type as 'movie' | 'tv')
      : item.title
      ? 'movie'
      : 'tv'
  const title = item.title || item.name || ''
  const date = item.release_date || item.first_air_date || ''
  const href = type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`

  const [faved, setFaved] = useState(() => Favorites.has(item.id, type))
  const [loaded, setLoaded] = useState(false)

  const norm: MediaItem = {
    id: item.id,
    media_type: type,
    title,
    poster_path: item.poster_path,
    vote_average: item.vote_average,
    release_date: date,
  }

  const onFav = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const added = Favorites.toggle(norm, type)
    setFaved(added)
    toast(added ? t('toast_added') : t('toast_removed'))
    emitFavChange()
  }

  return (
    <Link
      to={href}
      className="movie-card group relative block shrink-0 rounded-lg overflow-hidden shadow-md bg-gray-200"
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={img(item.poster_path)}
          alt={title}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          className={`fade-img card-img w-full h-full object-cover ${loaded ? 'loaded' : ''}`}
        />
        {type === 'tv' && <span className="type-badge">TV</span>}
        <button type="button" className="fav-btn" aria-label="favorite" onClick={onFav}>
          {faved ? '❤️' : '🤍'}
        </button>
        <div className="card-overlay">
          <p className="card-title">{title}</p>
          <p className="card-sub">
            ⭐ {rating(item.vote_average)} · {year(date)}
          </p>
        </div>
      </div>
    </Link>
  )
}
