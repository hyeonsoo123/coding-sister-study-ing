# 임현수 · 백엔드 개발자 포트폴리오

2년차 백엔드 개발자 임현수의 학습·포트폴리오 프로젝트 모음입니다.
정적 웹(HTML/CSS/JS) 위에 **Firebase Realtime Database 기반 TODO 앱**, **TMDB API 영화 사이트**, **테트리스 미니게임 테마**를 담고 있습니다.

## 📄 페이지 구성

- **`index.html`** — 캘린더 기반 TODO 앱 (첫 화면)
- **`movie.html`** — 영화·TV 정보 사이트 (TMDB API, 상세/인물/찜 기능 포함)
- **`about.html`** — 포트폴리오 (소개 / 주요 프로젝트 / 연락처)
- **테마 전환** — 기본 테마 ↔ 테트리스(네온 아케이드) 테마. 테트리스 테마에서는 플레이 가능한 미니게임이 나타납니다.

## ✨ TODO 앱 기능

- **🔥 Firebase Realtime Database**: 실시간 동기화 — 다른 브라우저/기기에서 변경해도 즉시 반영
- **📅 캘린더 뷰**: 월별 캘린더에서 날짜 선택, 작업 있는 날짜 강조
- **✅ 작업 관리**: 제목·설명과 함께 등록
- **📊 필터링**: 전체 / 진행중 / 완료
- **⏱️ 기록**: 생성·완료 시각 자동 저장
- **📱 반응형**: 모바일(탭 전환) / 데스크톱(캘린더+목록 3열) 레이아웃

## 🎮 테트리스 미니게임

- Canvas API로 구현 (7종 블록, 회전·충돌·라인 제거)
- 키보드(방향키/스페이스/P) + 모바일 터치 버튼 조작 지원

## 📁 프로젝트 구조

```
coding-sister-study/
├── public/                    # 배포 대상 정적 파일
│   ├── index.html             # TODO 앱 (첫 화면)
│   ├── movie.html             # 영화 홈
│   ├── movie-detail.html      # 영화 상세
│   ├── tv-detail.html         # TV 상세
│   ├── person.html            # 인물 상세
│   ├── about.html             # 포트폴리오
│   ├── css/
│   └── js/
│       ├── firebase-config.js # Firebase 프로젝트 설정 (콘솔 값 붙여넣기)
│       ├── firebase.js        # Realtime Database 연결 (ES 모듈)
│       ├── app.js             # 앱 초기화·탭 전환
│       ├── calendar.js        # 캘린더 렌더링
│       ├── todo.js            # TODO 로직
│       ├── tetris.js          # 테트리스 게임
│       ├── themes.js          # 테마 전환
│       └── movie/             # 영화 사이트 모듈
├── src/css/input.css          # Tailwind 입력 파일
├── package.json
└── README.md
```

## 🚀 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:8081` 접속.

### Firebase 설정 (TODO 앱)

1. [Firebase 콘솔](https://console.firebase.google.com)에서 프로젝트 생성
2. **빌드 > Realtime Database** 활성화 (테스트 모드)
3. 웹 앱 등록 후 발급되는 `firebaseConfig`를 `public/js/firebase-config.js`에 붙여넣기

## 💻 기술 스택

- **HTML5 / CSS3** (Tailwind CSS + 커스텀 반응형 스타일)
- **JavaScript (ES6+)** — 캘린더·TODO·테트리스 로직, Canvas API
- **Firebase Realtime Database** — TODO 데이터 실시간 저장·동기화
- **TMDB API** — 영화·TV 데이터
- **live-server** — 개발 서버

## 📝 참고

- TODO 데이터는 Firebase Realtime Database에 저장됩니다 (설정 전에는 안내 문구 표시).
- 서버 코드 없이 브라우저에서 직접 Firebase/TMDB API를 호출하는 정적 사이트입니다.

---

**버전**: 1.1.0
