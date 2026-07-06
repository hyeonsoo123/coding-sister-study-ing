// ============================================================
//  인물 상세 (기존 person.html + person.js 이식)
//  ?id=123 → /person/:id : 배우/감독 프로필 · 약력 · 필모그래피
// ============================================================
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import MovieShell from './MovieShell'
import MediaCard from '../../components/MediaCard'
import { TMDBApi, type MediaItem } from '../../lib/tmdb'
import { profileImg, PROFILE_FALLBACK } from '../../lib/format'
import { useI18n, LangSelect } from '../../i18n'

// 부서명 → i18n 키
const DEPT_KEY: Record<string, string> = {
  Acting: 'dept_acting',
  Directing: 'dept_directing',
  Writing: 'dept_writing',
  Production: 'dept_production',
  Sound: 'dept_sound',
  Camera: 'dept_camera',
}

// 생몰 표기 "birthday ~ deathday"
function ageText(birthday?: string, deathday?: string): string {
  if (!birthday) return ''
  if (deathday) return `${birthday} ~ ${deathday}`
  return birthday
}

// 출연작 정리(영화+TV 통합): 포스터 있는 것만, 중복 제거, 최신순
function filmography(person: any): MediaItem[] {
  const seen = new Set<string>()
  const dateOf = (m: any) => m.release_date || m.first_air_date || ''
  return (person.combined_credits?.cast || [])
    .filter((m: any) => {
      const key = `${m.media_type}:${m.id}`
      return m.poster_path && !seen.has(key) && seen.add(key)
    })
    .sort((a: any, b: any) => dateOf(b).localeCompare(dateOf(a)))
}

// ---------- 프로필 본문 ----------
function Profile({ person }: { person: any }) {
  const { t } = useI18n()

  const dept = DEPT_KEY[person.known_for_department]
    ? t(DEPT_KEY[person.known_for_department])
    : person.known_for_department || ''
  const films = useMemo(() => filmography(person), [person])
  const bio = (person.biography || '').trim()
  const bioLong = bio.length > 400
  const [clamped, setClamped] = useState(true)

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        <img
          src={profileImg(person.profile_path, 'w342')}
          alt={person.name}
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).src = PROFILE_FALLBACK
          }}
          className="w-40 sm:w-56 rounded-xl shadow-lg shrink-0 mx-auto sm:mx-0"
        />
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl sm:text-4xl font-bold text-gray-900">{person.name}</h2>
          {dept && <p className="text-indigo-600 font-semibold mt-1">{dept}</p>}
          <div className="flex flex-wrap gap-3 mt-4 text-sm text-gray-600">
            {person.birthday && (
              <span className="px-3 py-1 bg-gray-100 rounded-full">
                🎂 {ageText(person.birthday, person.deathday)}
              </span>
            )}
            {person.place_of_birth && (
              <span className="px-3 py-1 bg-gray-100 rounded-full">📍 {person.place_of_birth}</span>
            )}
            <span className="px-3 py-1 bg-gray-100 rounded-full">
              🎬 {t('p_films', { n: films.length })}
            </span>
          </div>
          {bio ? (
            <div className="mt-4">
              <p
                className={`bio-body text-gray-700 text-sm leading-relaxed whitespace-pre-line ${
                  bioLong && clamped ? 'clamped' : ''
                }`}
              >
                {bio}
              </p>
              {bioLong && (
                <button
                  type="button"
                  className="text-indigo-600 text-sm font-semibold mt-1"
                  onClick={() => setClamped((c) => !c)}
                >
                  {clamped ? t('more_btn') : t('less_btn')}
                </button>
              )}
            </div>
          ) : (
            <p className="mt-4 text-gray-400 text-sm">{t('p_no_bio')}</p>
          )}
        </div>
      </div>

      {films.length ? (
        <section className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-3">🎞 {t('p_filmo')}</h3>
          <div className="movie-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {films.map((m) => (
              <MediaCard key={`${m.media_type}:${m.id}`} item={m} />
            ))}
          </div>
        </section>
      ) : (
        <p className="text-gray-400 text-center py-10">{t('p_no_films')}</p>
      )}
    </>
  )
}

// ---------- 페이지 ----------
export default function Person() {
  const { t } = useI18n()
  const { id } = useParams<{ id: string }>()
  const [person, setPerson] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError(t('err_load_person'))
      return
    }
    let alive = true
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const data = await TMDBApi.person(id)
        if (!alive) return
        setPerson(data)
        setLoading(false)
        document.title = `${data.name} · Coding Sister`
        window.scrollTo({ top: 0 })
      } catch (err: any) {
        if (!alive) return
        setLoading(false)
        setError(`${t('err_load_person')} (${err.message})`)
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
        ) : error || !person ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">😵</div>
            <p className="text-lg font-bold text-gray-700">{error || t('err_load_person')}</p>
            <Link
              to="/movie"
              className="inline-block mt-5 px-5 py-3 bg-indigo-600 text-white rounded-lg font-semibold"
            >
              ← {t('home_btn')}
            </Link>
          </div>
        ) : (
          <Profile person={person} />
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
