// 예고편 인라인 재생 (기존 UI.trailerBlock + enableTrailerPlay 이식)
// 썸네일 + ▶ → 클릭 시에만 유튜브 iframe 로드
import { useState } from 'react'

export default function TrailerEmbed({ videoKey }: { videoKey: string }) {
  const [playing, setPlaying] = useState(false)
  const thumb = `https://img.youtube.com/vi/${videoKey}/hqdefault.jpg`

  return (
    <div
      className="trailer-embed relative w-full rounded-xl overflow-hidden shadow-lg cursor-pointer"
      style={{ aspectRatio: '16/9' }}
    >
      {playing ? (
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoKey}?autoplay=1`}
          title="예고편"
          frameBorder="0"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      ) : (
        <>
          <img src={thumb} alt="예고편 썸네일" className="w-full h-full object-cover" />
          <button
            type="button"
            className="trailer-play absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/35 transition"
            aria-label="예고편 재생"
            onClick={() => setPlaying(true)}
          >
            <span className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center text-2xl shadow-lg">
              ▶
            </span>
          </button>
        </>
      )}
    </div>
  )
}
