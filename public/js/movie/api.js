// ============================================================
//  TMDB API 호출 래퍼
//  - 모든 요청에 언어(ko-KR)를 기본으로 붙이고 Bearer 토큰으로 인증
//  - 무료(=전체) API가 제공하는 기능을 폭넓게 노출
// ============================================================
const TMDBApi = (() => {
    const headers = {
        Authorization: `Bearer ${TMDB.ACCESS_TOKEN}`,
        accept: 'application/json',
    };

    async function get(path, params = {}) {
        const url = new URL(`${TMDB.BASE_URL}${path}`);
        url.searchParams.set('language', TMDB.LANG);
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== '') {
                url.searchParams.set(key, value);
            }
        }

        const res = await fetch(url, { headers });
        if (!res.ok) {
            throw new Error(`TMDB 요청 실패 (${res.status} ${res.statusText})`);
        }
        return res.json();
    }

    // 상세 1회 호출에 붙일 수 있는 부가 정보 전부 (append_to_response)
    const DETAIL_APPEND =
        'videos,credits,similar,recommendations,reviews,release_dates,watch/providers,images,keywords';

    return {
        get, // 필요 시 직접 호출용

        // ----- 목록/둘러보기 -----
        popular: (page = 1) => get('/movie/popular', { page }),
        nowPlaying: (page = 1) => get('/movie/now_playing', { page, region: TMDB.REGION }),
        upcoming: (page = 1) => get('/movie/upcoming', { page, region: TMDB.REGION }),
        topRated: (page = 1) => get('/movie/top_rated', { page }),
        trending: (window = 'week') => get(`/trending/movie/${window}`),

        // ----- 장르/탐색 -----
        genres: () => get('/genre/movie/list'),
        discover: (params = {}) =>
            get('/discover/movie', { sort_by: 'popularity.desc', include_adult: false, ...params }),
        byGenre: (genreId, page = 1) =>
            get('/discover/movie', { with_genres: genreId, sort_by: 'popularity.desc', page }),

        // ----- 검색 -----
        search: (query, page = 1) =>
            get('/search/movie', { query, page, include_adult: false }),

        // ----- 상세 (부가정보 한 번에) -----
        detail: (id) =>
            get(`/movie/${id}`, {
                append_to_response: DETAIL_APPEND,
                include_image_language: 'ko,en,null',
            }),

        // 리뷰: ko-KR은 대부분 비어있어 en-US로 별도 조회 (실제로 보이게)
        reviews: (id, page = 1) => get(`/movie/${id}/reviews`, { page, language: 'en-US' }),
        // 예고편(비디오)만 가볍게 조회 (히어로 예고편 재생용)
        movieVideos: (id) => get(`/movie/${id}/videos`),

        // ----- TV / 시리즈 -----
        tvPopular: (page = 1) => get('/tv/popular', { page }),
        tvOnTheAir: (page = 1) => get('/tv/on_the_air', { page }),
        tvTopRated: (page = 1) => get('/tv/top_rated', { page }),
        tvTrending: (window = 'week') => get(`/trending/tv/${window}`),
        tvGenres: () => get('/genre/tv/list'),
        tvByGenre: (genreId, page = 1) =>
            get('/discover/tv', { with_genres: genreId, sort_by: 'popularity.desc', page }),
        tvDetail: (id) =>
            get(`/tv/${id}`, {
                append_to_response:
                    'videos,aggregate_credits,similar,recommendations,reviews,content_ratings,watch/providers,images,keywords',
                include_image_language: 'ko,en,null',
            }),
        tvReviews: (id, page = 1) => get(`/tv/${id}/reviews`, { page, language: 'en-US' }),

        // ----- 통합 검색 (영화 + TV + 인물) -----
        searchMulti: (query, page = 1) => get('/search/multi', { query, page, include_adult: false }),

        // 추천작 (찜 기반 개인화 줄용) — movie/tv 겸용
        recommendations: (mediaType, id) =>
            get(`/${mediaType === 'tv' ? 'tv' : 'movie'}/${id}/recommendations`),

        // ----- 인물 (영화+TV 통합 크레딧) -----
        person: (id) =>
            get(`/person/${id}`, { append_to_response: 'combined_credits,images' }),
    };
})();
