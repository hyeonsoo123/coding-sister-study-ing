// ============================================================
//  다국어 사전 (기존 movie/i18n.js 이식)
//  - t(key, params): UI 문자열 번역
//  - 언어 상태는 localStorage('cs_lang'), 변경 시 페이지 새로고침으로 반영
// ============================================================

export const KEY = 'cs_lang'

export const LANGS: Record<string, { label: string; tmdb: string }> = {
  ko: { label: '한국어', tmdb: 'ko-KR' },
  en: { label: 'English', tmdb: 'en-US' },
  ja: { label: '日本語', tmdb: 'ja-JP' },
}

export type LangKey = keyof typeof LANGS

let lang: string = localStorage.getItem(KEY) || 'ko'
if (!LANGS[lang]) lang = 'ko'

export const DICT: Record<string, Record<string, string>> = {
  ko: {
    nav_home: '홈', nav_series: '시리즈', nav_browse: '탐색', nav_fav: '내 찜', hero_detail: '상세 보기', no_trailer: '예고편이 없어요',
    search_ph: '영화·시리즈 검색…', more: '더 보기', header_about: '내 정보',
    footer_data: '데이터 제공:', back: '← 뒤로', movie_home: '← 영화 홈',
    f_genre: '장르', f_sort: '정렬', f_rating: '최소 평점', f_year: '연도', f_apply: '적용', f_reset: '초기화',
    sort_pop: '인기순', sort_rating: '평점순', sort_new: '최신순', sort_revenue: '흥행순',
    rating_all: '전체', year_ph: '예: 2024', genre_loading: '장르 불러오는 중…', genre_fail: '장르 로드 실패',
    row_popular: '지금 인기', row_now: '현재 상영 중', row_upcoming: '개봉 예정', row_trend: '이번 주 트렌드',
    row_top: '평점 높은 명작', row_action: '액션', row_comedy: '코미디', row_horror: '공포', row_anim: '애니메이션',
    row_recent: '최근 본 작품', row_because: "'{title}' 기반 추천",
    tv_popular: '인기 시리즈', tv_onair: '방영 중', tv_trend: '이번 주 트렌드', tv_top: '평점 높은 시리즈',
    tv_drama: '드라마', tv_action_adv: '액션 & 모험', tv_scifi: 'SF & 판타지',
    search_searching: '"{q}" 검색 중…', search_results: '"{q}" 검색 결과 {n}건', search_fail: '검색 실패',
    empty_search_t: '검색 결과가 없어요', empty_search_d: '다른 제목으로 검색해보세요.',
    empty_fav_t: '아직 찜한 작품이 없어요', empty_fav_d: '포스터 위 하트를 눌러 담아보세요.',
    empty_browse_t: '조건에 맞는 작품이 없어요', empty_browse_d: '필터를 조정해보세요.',
    no_movies: '표시할 작품이 없어요.', load_fail: '불러오기 실패', fav_heading: '내가 찜한 작품',
    toast_added: '찜 목록에 추가했어요 ❤️', toast_removed: '찜 목록에서 뺐어요', toast_more_fail: '더 불러오기 실패',
    sec_providers: '어디서 볼 수 있나', region_kr: '한국', prov_stream: '스트리밍', prov_rent: '대여', prov_buy: '구매',
    prov_justwatch: 'JustWatch에서 전체 보기 →', sec_overview: '줄거리', sec_trailer: '예고편',
    sec_cast: '출연진', cast_hint: '클릭하면 필모그래피', sec_rec_movie: '이 영화를 봤다면', sec_sim_movie: '비슷한 영화',
    sec_rec_tv: '이 시리즈를 봤다면', sec_sim_tv: '비슷한 시리즈', sec_reviews: '리뷰', sec_stills: '스틸컷',
    more_btn: '더보기', less_btn: '접기', fav_do: '찜하기', fav_done: '찜 완료', votes: '{n}명 평가',
    loading: '불러오는 중…', home_btn: '홈으로', err_bad: '잘못된 접근이에요. ID가 없어요.',
    err_load_movie: '영화 정보를 불러오지 못했어요.', err_load_tv: '시리즈 정보를 불러오지 못했어요.',
    err_load_person: '인물 정보를 불러오지 못했어요.',
    tba: '미정',
    hour: '시간', min: '분', seasons: '시즌 {s} · {e}화', per_ep: '회당 {t}', ch_label: '채널', creator_label: '제작',
    st_returning: '방영 중', st_ended: '종영', st_canceled: '취소', st_production: '제작 중', st_planned: '방영 예정', st_pilot: '파일럿',
    dept_acting: '배우', dept_directing: '감독', dept_writing: '각본', dept_production: '제작', dept_sound: '음악', dept_camera: '촬영',
    p_films: '출연작 {n}편', p_filmo: '출연 작품', p_no_bio: '등록된 약력이 없어요.', p_no_films: '출연 작품 정보가 없어요.',
  },
  en: {
    nav_home: 'Home', nav_series: 'Series', nav_browse: 'Browse', nav_fav: 'My List', hero_detail: 'Details', no_trailer: 'No trailer available',
    search_ph: 'Search movies & series…', more: 'Load more', header_about: 'About me',
    footer_data: 'Data by:', back: '← Back', movie_home: '← Home',
    f_genre: 'Genre', f_sort: 'Sort', f_rating: 'Min rating', f_year: 'Year', f_apply: 'Apply', f_reset: 'Reset',
    sort_pop: 'Popularity', sort_rating: 'Rating', sort_new: 'Newest', sort_revenue: 'Revenue',
    rating_all: 'All', year_ph: 'e.g. 2024', genre_loading: 'Loading genres…', genre_fail: 'Failed to load genres',
    row_popular: 'Popular now', row_now: 'Now playing', row_upcoming: 'Coming soon', row_trend: 'Trending this week',
    row_top: 'Top rated', row_action: 'Action', row_comedy: 'Comedy', row_horror: 'Horror', row_anim: 'Animation',
    row_recent: 'Recently viewed', row_because: "Because you liked '{title}'",
    tv_popular: 'Popular series', tv_onair: 'On the air', tv_trend: 'Trending this week', tv_top: 'Top rated series',
    tv_drama: 'Drama', tv_action_adv: 'Action & Adventure', tv_scifi: 'Sci-Fi & Fantasy',
    search_searching: 'Searching "{q}"…', search_results: '{n} results for "{q}"', search_fail: 'Search failed',
    empty_search_t: 'No results', empty_search_d: 'Try a different title.',
    empty_fav_t: 'Your list is empty', empty_fav_d: 'Tap the heart on a poster to add it.',
    empty_browse_t: 'No matches', empty_browse_d: 'Try adjusting the filters.',
    no_movies: 'Nothing to show.', load_fail: 'Failed to load', fav_heading: 'My List',
    toast_added: 'Added to your list ❤️', toast_removed: 'Removed from your list', toast_more_fail: 'Failed to load more',
    sec_providers: 'Where to watch', region_kr: 'Korea', prov_stream: 'Streaming', prov_rent: 'Rent', prov_buy: 'Buy',
    prov_justwatch: 'See all on JustWatch →', sec_overview: 'Overview', sec_trailer: 'Trailer',
    sec_cast: 'Cast', cast_hint: 'tap for filmography', sec_rec_movie: 'If you liked this', sec_sim_movie: 'Similar movies',
    sec_rec_tv: 'If you liked this', sec_sim_tv: 'Similar series', sec_reviews: 'Reviews', sec_stills: 'Stills',
    more_btn: 'More', less_btn: 'Less', fav_do: 'Add to list', fav_done: 'In your list', votes: '{n} votes',
    loading: 'Loading…', home_btn: 'Home', err_bad: 'Invalid access. Missing ID.',
    err_load_movie: "Couldn't load the movie.", err_load_tv: "Couldn't load the series.",
    err_load_person: "Couldn't load the person.",
    tba: 'TBA',
    hour: 'h', min: 'm', seasons: '{s} seasons · {e} ep', per_ep: '{t}/ep', ch_label: 'Network', creator_label: 'Created by',
    st_returning: 'Returning', st_ended: 'Ended', st_canceled: 'Canceled', st_production: 'In production', st_planned: 'Planned', st_pilot: 'Pilot',
    dept_acting: 'Actor', dept_directing: 'Director', dept_writing: 'Writer', dept_production: 'Producer', dept_sound: 'Sound', dept_camera: 'Camera',
    p_films: '{n} titles', p_filmo: 'Filmography', p_no_bio: 'No biography available.', p_no_films: 'No filmography available.',
  },
  ja: {
    nav_home: 'ホーム', nav_series: 'シリーズ', nav_browse: 'さがす', nav_fav: 'お気に入り', hero_detail: '詳細', no_trailer: '予告編がありません',
    search_ph: '映画・シリーズを検索…', more: 'もっと見る', header_about: 'プロフィール',
    footer_data: 'データ提供:', back: '← 戻る', movie_home: '← ホーム',
    f_genre: 'ジャンル', f_sort: '並び替え', f_rating: '最低評価', f_year: '年', f_apply: '適用', f_reset: 'リセット',
    sort_pop: '人気順', sort_rating: '評価順', sort_new: '新着順', sort_revenue: '興行順',
    rating_all: 'すべて', year_ph: '例: 2024', genre_loading: 'ジャンル読み込み中…', genre_fail: 'ジャンルの読み込み失敗',
    row_popular: '人気の作品', row_now: '上映中', row_upcoming: '公開予定', row_trend: '今週のトレンド',
    row_top: '高評価の名作', row_action: 'アクション', row_comedy: 'コメディ', row_horror: 'ホラー', row_anim: 'アニメ',
    row_recent: '最近見た作品', row_because: '「{title}」が好きなあなたに',
    tv_popular: '人気シリーズ', tv_onair: '放送中', tv_trend: '今週のトレンド', tv_top: '高評価シリーズ',
    tv_drama: 'ドラマ', tv_action_adv: 'アクション&アドベンチャー', tv_scifi: 'SF&ファンタジー',
    search_searching: '「{q}」を検索中…', search_results: '「{q}」の検索結果 {n}件', search_fail: '検索に失敗しました',
    empty_search_t: '検索結果がありません', empty_search_d: '別のタイトルで検索してみてください。',
    empty_fav_t: 'お気に入りはまだありません', empty_fav_d: 'ポスターのハートを押して追加。',
    empty_browse_t: '条件に合う作品がありません', empty_browse_d: 'フィルターを調整してください。',
    no_movies: '表示する作品がありません。', load_fail: '読み込み失敗', fav_heading: 'お気に入り',
    toast_added: 'お気に入りに追加しました ❤️', toast_removed: 'お気に入りから削除しました', toast_more_fail: 'さらに読み込めませんでした',
    sec_providers: '視聴できる場所', region_kr: '韓国', prov_stream: 'ストリーミング', prov_rent: 'レンタル', prov_buy: '購入',
    prov_justwatch: 'JustWatchで全部見る →', sec_overview: 'あらすじ', sec_trailer: '予告編',
    sec_cast: 'キャスト', cast_hint: 'クリックで出演作', sec_rec_movie: 'この映画が好きなら', sec_sim_movie: '似ている映画',
    sec_rec_tv: 'このシリーズが好きなら', sec_sim_tv: '似ているシリーズ', sec_reviews: 'レビュー', sec_stills: 'スチール',
    more_btn: 'もっと', less_btn: '閉じる', fav_do: 'お気に入り', fav_done: '追加済み', votes: '{n}件の評価',
    loading: '読み込み中…', home_btn: 'ホームへ', err_bad: '不正なアクセスです。IDがありません。',
    err_load_movie: '映画情報を読み込めませんでした。', err_load_tv: 'シリーズ情報を読み込めませんでした。',
    err_load_person: '人物情報を読み込めませんでした。',
    tba: '未定',
    hour: '時間', min: '分', seasons: 'シーズン{s}・{e}話', per_ep: '1話 {t}', ch_label: '放送局', creator_label: '制作',
    st_returning: '放送中', st_ended: '完結', st_canceled: '打ち切り', st_production: '制作中', st_planned: '放送予定', st_pilot: 'パイロット',
    dept_acting: '俳優', dept_directing: '監督', dept_writing: '脚本', dept_production: '製作', dept_sound: '音楽', dept_camera: '撮影',
    p_films: '出演作 {n}本', p_filmo: '出演作品', p_no_bio: '経歴情報がありません。', p_no_films: '出演作品がありません。',
  },
}

export function t(key: string, params?: Record<string, string | number>): string {
  let s = (DICT[lang] && DICT[lang][key]) || DICT.ko[key] || key
  if (params) {
    for (const [k, v] of Object.entries(params)) s = s.split('{' + k + '}').join(String(v))
  }
  return s
}

export function getLang(): string {
  return lang
}

export function tmdbLang(): string {
  return LANGS[lang].tmdb
}

// 언어 변경 — 저장 후 새로고침(콘텐츠+UI 한 번에 반영, 기존 동작과 동일)
export function setLang(next: string) {
  if (!LANGS[next] || next === lang) return
  localStorage.setItem(KEY, next)
  location.reload()
}
