// ============================================================
//  TMDB API 설정
// ------------------------------------------------------------
//  ⚠️ 정적 사이트(GitHub Pages) 특성상 이 토큰은 배포 시 공개됩니다.
//     읽기 전용(api_read) 토큰이라 "조회"만 가능하고, 쓰기/삭제는 불가합니다.
//     - 재발급하거나 백엔드 프록시로 숨기게 되면 이 파일만 고치면 됩니다.
// ============================================================
const TMDB = {
    // v4 액세스 토큰 (Bearer 인증 — 요즘 권장 방식)
    ACCESS_TOKEN:
        'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlOTUwZmMwZWM0NjU1ZGRiZmM5MGI5OWVjMzJmYTMyNiIsIm5iZiI6MTc4Mjg3NzczMC4yNzksInN1YiI6IjZhNDQ4ZTIyYzRhMGYxMjViOGRmMGRkYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.0el8e3-qoPJDV9SDxSWyzH4wF9Xgqiuv5bU5AF9znuE',
    // v3 API 키 (일부 클라이언트가 필요로 할 때 대비 — 현재는 미사용)
    API_KEY: 'e950fc0ec4655ddbfc90b99ec32fa326',

    BASE_URL: 'https://api.themoviedb.org/3',
    IMG_URL: 'https://image.tmdb.org/t/p',
    // 콘텐츠 언어: 선택된 언어(i18n)에 따라 결정 (없으면 한국어)
    LANG: typeof I18N !== 'undefined' ? I18N.tmdbLang() : 'ko-KR',
    REGION: 'KR',
};
