// ============================================================
//  찜 목록 관리 (localStorage 기반, 백엔드 불필요)
//  - 영화/TV 겸용: (media_type, id) 조합으로 구분
//  - 저장은 카드 렌더에 필요한 최소 정보만
// ============================================================
const Favorites = (() => {
    const KEY = 'cs_movie_favorites';

    function all() {
        try {
            return JSON.parse(localStorage.getItem(KEY)) || [];
        } catch {
            return [];
        }
    }

    function save(list) {
        localStorage.setItem(KEY, JSON.stringify(list));
    }

    function typeOf(item, fallback) {
        return item.media_type || fallback || 'movie';
    }

    function has(id, type = 'movie') {
        return all().some((m) => m.id === id && (m.media_type || 'movie') === type);
    }

    // 찜 추가/제거 토글 → 추가되면 true, 제거되면 false 반환
    function toggle(item, type) {
        const t = typeOf(item, type);
        const list = all();
        const idx = list.findIndex((m) => m.id === item.id && (m.media_type || 'movie') === t);
        if (idx >= 0) {
            list.splice(idx, 1);
            save(list);
            return false;
        }
        list.unshift({
            id: item.id,
            media_type: t,
            title: item.title || item.name,
            poster_path: item.poster_path,
            vote_average: item.vote_average,
            release_date: item.release_date || item.first_air_date,
        });
        save(list);
        return true;
    }

    function count() {
        return all().length;
    }

    return { all, has, toggle, count };
})();
