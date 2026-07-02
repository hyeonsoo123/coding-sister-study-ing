// ============================================================
//  movie-detail.html 컨트롤러 (다국어 지원)
//  관람등급 · 어디서 볼 수 있나 · 줄거리/키워드 · 예고편 ·
//  출연진(인물 링크) · 추천작 · 비슷한 영화 · 리뷰 · 스틸컷
// ============================================================
(() => {
    const T = I18N.t;
    const root = document.getElementById('detailRoot');

    function getId() {
        const id = new URLSearchParams(location.search).get('id');
        return id && /^\d+$/.test(id) ? id : null;
    }

    function runtimeText(min) {
        if (!min) return '';
        const h = Math.floor(min / 60);
        const m = min % 60;
        return h ? `${h}${T('hour')} ${m}${T('min')}` : `${m}${T('min')}`;
    }

    function pickTrailer(videos) {
        const list = (videos?.results || []).filter((v) => v.site === 'YouTube');
        return (
            list.find((v) => v.type === 'Trailer' && v.official) ||
            list.find((v) => v.type === 'Trailer') ||
            list.find((v) => v.type === 'Teaser') ||
            list[0] ||
            null
        );
    }

    function certBadgeHtml(movie) {
        const badge = UI.certLabel(UI.certKR(movie.release_dates));
        return badge ? `<span class="px-3 py-1 ${badge.cls} rounded-full font-bold">${badge.text}</span>` : '';
    }

    function keywordsHtml(movie) {
        const kws = (movie.keywords?.keywords || []).slice(0, 12);
        if (!kws.length) return '';
        return `<div class="flex flex-wrap gap-2 mt-3">
            ${kws
                .map((k) => `<span class="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-xs"># ${UI.escapeHtml(k.name)}</span>`)
                .join('')}
        </div>`;
    }

    function providersHtml(movie) {
        const kr = movie['watch/providers']?.results?.KR;
        if (!kr) return '';
        const dedupe = (arr) => {
            const seen = new Set();
            return (arr || []).filter((p) => (seen.has(p.provider_id) ? false : seen.add(p.provider_id)));
        };
        const group = (label, arr) => {
            const items = dedupe(arr);
            if (!items.length) return '';
            return `
                <div class="mb-3">
                    <p class="text-sm text-gray-500 mb-2">${label}</p>
                    <div class="flex flex-wrap gap-3">
                        ${items
                            .map(
                                (p) => `
                            <div class="flex flex-col items-center w-16 text-center">
                                <img src="${UI.img(p.logo_path, 'w92')}" alt="${UI.escapeHtml(p.provider_name)}"
                                     title="${UI.escapeHtml(p.provider_name)}" class="w-12 h-12 rounded-xl object-cover shadow">
                                <span class="text-[11px] text-gray-500 mt-1 leading-tight">${UI.escapeHtml(p.provider_name)}</span>
                            </div>`
                            )
                            .join('')}
                    </div>
                </div>`;
        };
        const body = group('🔵 ' + T('prov_stream'), kr.flatrate) + group('💰 ' + T('prov_rent'), kr.rent) + group('🛒 ' + T('prov_buy'), kr.buy);
        if (!body) return '';
        return `
            <section class="mb-8 bg-white rounded-xl shadow p-5">
                <h3 class="text-xl font-bold text-gray-800 mb-3">📺 ${T('sec_providers')} <span class="text-xs font-normal text-gray-400">(${T('region_kr')})</span></h3>
                ${body}
                ${kr.link ? `<a href="${kr.link}" target="_blank" rel="noopener" class="inline-block mt-1 text-sm text-indigo-600 hover:underline">${T('prov_justwatch')}</a>` : ''}
            </section>`;
    }

    function reviewsHtml(movie) {
        const list = (movie.reviews?.results || []).slice(0, 3);
        if (!list.length) return '';
        return `
            <section class="mb-8">
                <h3 class="text-xl font-bold text-gray-800 mb-3">📝 ${T('sec_reviews')}</h3>
                <div class="space-y-4">
                    ${list
                        .map((r) => {
                            const rating = r.author_details?.rating;
                            const content = UI.escapeHtml(r.content);
                            const long = content.length > 320;
                            return `
                            <div class="bg-white rounded-xl shadow p-5">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="font-bold text-gray-800">${UI.escapeHtml(r.author)}</span>
                                    ${rating ? `<span class="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold">⭐ ${rating}</span>` : ''}
                                </div>
                                <p class="review-body text-gray-600 text-sm leading-relaxed ${long ? 'clamped' : ''}">${content}</p>
                                ${long ? `<button type="button" class="review-more text-indigo-600 text-sm font-semibold mt-1">${T('more_btn')}</button>` : ''}
                            </div>`;
                        })
                        .join('')}
                </div>
            </section>`;
    }

    function stillsHtml(movie) {
        const stills = (movie.images?.backdrops || []).slice(0, 10);
        if (!stills.length) return '';
        return `
            <section class="mb-8">
                <h3 class="text-xl font-bold text-gray-800 mb-3">🖼 ${T('sec_stills')}</h3>
                <div class="flex gap-3 overflow-x-auto pb-2 row-scroll">
                    ${stills
                        .map(
                            (s) => `
                        <a href="${UI.img(s.file_path, 'original')}" target="_blank" rel="noopener" class="shrink-0">
                            <img src="${UI.img(s.file_path, 'w500')}" alt="still" loading="lazy"
                                 class="h-40 rounded-lg object-cover shadow hover:opacity-90 transition">
                        </a>`
                        )
                        .join('')}
                </div>
            </section>`;
    }

    function movieRowHtml(id, title) {
        return `
            <section class="mb-8">
                <h3 class="text-xl font-bold text-gray-800 mb-3">${title}</h3>
                <div id="${id}" class="flex gap-3 overflow-x-auto pb-2 row-scroll"></div>
            </section>`;
    }

    function render(movie) {
        const genres = (movie.genres || []).map((g) => g.name);
        const trailer = pickTrailer(movie.videos);
        const cast = (movie.credits?.cast || []).slice(0, 20);
        const recommendations = (movie.recommendations?.results || []).filter((m) => m.poster_path).slice(0, 15);
        const similar = (movie.similar?.results || []).filter((m) => m.poster_path).slice(0, 15);
        const isFav = Favorites.has(movie.id);

        root.innerHTML = `
            <div class="relative rounded-2xl overflow-hidden mb-8 shadow-lg">
                <div class="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
                    ${movie.backdrop_path ? `<img src="${UI.img(movie.backdrop_path, 'w1280')}" alt="" class="w-full h-full object-cover">` : ''}
                    <div class="absolute inset-0 bg-gradient-to-t from-[#0f1015] via-[#0f1015]/85 to-[#0f1015]/25"></div>
                </div>
                <div class="relative flex flex-col sm:flex-row gap-6 p-6 sm:p-8">
                    <img src="${UI.img(movie.poster_path)}" alt="${UI.escapeHtml(movie.title)}"
                         class="w-40 sm:w-56 rounded-xl shadow-lg shrink-0 mx-auto sm:mx-0">
                    <div class="flex-1 min-w-0">
                        <h2 class="text-2xl sm:text-4xl font-bold text-gray-900">
                            ${UI.escapeHtml(movie.title)}
                            <span class="text-gray-400 font-medium text-xl">${UI.year(movie.release_date)}</span>
                        </h2>
                        ${movie.original_title && movie.original_title !== movie.title ? `<p class="text-gray-400 text-sm mt-1">${UI.escapeHtml(movie.original_title)}</p>` : ''}
                        ${movie.tagline ? `<p class="text-indigo-600 font-semibold mt-1 italic">${UI.escapeHtml(movie.tagline)}</p>` : ''}
                        <div class="flex flex-wrap items-center gap-2 mt-4 text-sm">
                            <span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-bold">⭐ ${UI.rating(movie.vote_average)}</span>
                            ${certBadgeHtml(movie)}
                            ${movie.runtime ? `<span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">⏱ ${runtimeText(movie.runtime)}</span>` : ''}
                            <span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">🗳 ${T('votes', { n: (movie.vote_count || 0).toLocaleString() })}</span>
                        </div>
                        <div class="flex flex-wrap gap-2 mt-3">
                            ${genres.map((g) => `<span class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">${UI.escapeHtml(g)}</span>`).join('')}
                        </div>
                        <button id="favToggle" type="button"
                            class="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-lg font-bold min-h-[44px] transition
                                   ${isFav ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-gray-800 border-2 border-gray-300 hover:border-red-400'}">
                            <span id="favIcon">${isFav ? '❤️' : '🤍'}</span>
                            <span id="favLabel">${isFav ? T('fav_done') : T('fav_do')}</span>
                        </button>
                    </div>
                </div>
            </div>

            ${providersHtml(movie)}

            ${
                movie.overview
                    ? `<section class="mb-8">
                        <h3 class="text-xl font-bold text-gray-800 mb-2">📖 ${T('sec_overview')}</h3>
                        <p class="text-gray-700 leading-relaxed">${UI.escapeHtml(movie.overview)}</p>
                        ${keywordsHtml(movie)}
                       </section>`
                    : ''
            }

            ${
                trailer
                    ? `<section class="mb-8">
                        <h3 class="text-xl font-bold text-gray-800 mb-3">▶️ ${T('sec_trailer')}</h3>
                        ${UI.trailerBlock(trailer.key)}
                       </section>`
                    : ''
            }

            ${
                cast.length
                    ? `<section class="mb-8">
                        <h3 class="text-xl font-bold text-gray-800 mb-3">🎭 ${T('sec_cast')} <span class="text-xs font-normal text-gray-400">(${T('cast_hint')})</span></h3>
                        <div class="flex gap-4 overflow-x-auto pb-2 row-scroll">
                            ${cast
                                .map(
                                    (p) => `
                                <a href="person.html?id=${p.id}" class="shrink-0 w-24 text-center group">
                                    <img src="${UI.profileImg(p.profile_path, 'w185')}" alt="${UI.escapeHtml(p.name)}"
                                         loading="lazy" class="w-24 h-24 rounded-full object-cover mx-auto shadow group-hover:ring-2 group-hover:ring-indigo-400 transition">
                                    <p class="text-sm font-semibold text-gray-800 mt-2 leading-tight group-hover:text-indigo-600">${UI.escapeHtml(p.name)}</p>
                                    <p class="text-xs text-gray-500 leading-tight">${UI.escapeHtml(p.character || '')}</p>
                                </a>`
                                )
                                .join('')}
                        </div>
                       </section>`
                    : ''
            }

            ${recommendations.length ? movieRowHtml('recommendRow', '👍 ' + T('sec_rec_movie')) : ''}
            ${similar.length ? movieRowHtml('similarRow', '🎞 ' + T('sec_sim_movie')) : ''}
            ${reviewsHtml(movie)}
            ${stillsHtml(movie)}
        `;

        const recRow = document.getElementById('recommendRow');
        if (recRow) recommendations.forEach((m) => recRow.appendChild(UI.mediaCard(m)));
        const similarRow = document.getElementById('similarRow');
        if (similarRow) similar.forEach((m) => similarRow.appendChild(UI.mediaCard(m)));

        root.querySelectorAll('.review-more').forEach((btn) => {
            btn.addEventListener('click', () => {
                const body = btn.previousElementSibling;
                const clamped = body.classList.toggle('clamped');
                btn.textContent = clamped ? T('more_btn') : T('less_btn');
            });
        });

        const favBtn = document.getElementById('favToggle');
        favBtn.addEventListener('click', () => {
            const added = Favorites.toggle(movie);
            document.getElementById('favIcon').textContent = added ? '❤️' : '🤍';
            document.getElementById('favLabel').textContent = added ? T('fav_done') : T('fav_do');
            favBtn.className =
                'mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-lg font-bold min-h-[44px] transition ' +
                (added ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-gray-800 border-2 border-gray-300 hover:border-red-400');
            UI.toast(added ? T('toast_added') : T('toast_removed'));
        });

        document.title = `${movie.title} · Coding Sister`;
        Recent.add(movie, 'movie');
    }

    function renderError(message) {
        root.innerHTML = `
            <div class="text-center py-20">
                <div class="text-6xl mb-4">😵</div>
                <p class="text-lg font-bold text-gray-700">${UI.escapeHtml(message)}</p>
                <a href="movie.html" class="inline-block mt-5 px-5 py-3 bg-indigo-600 text-white rounded-lg font-semibold">← ${T('home_btn')}</a>
            </div>`;
    }

    async function init() {
        const id = getId();
        if (!id) {
            renderError(T('err_bad'));
            return;
        }
        root.innerHTML = `<div class="text-center py-20 text-gray-400 animate-pulse">${T('loading')}</div>`;
        try {
            const movie = await TMDBApi.detail(id);
            if (!movie.reviews?.results?.length) {
                try {
                    movie.reviews = await TMDBApi.reviews(id);
                } catch { /* 리뷰 실패는 무시 */ }
            }
            render(movie);
            window.scrollTo({ top: 0 });
        } catch (err) {
            renderError(`${T('err_load_movie')} (${err.message})`);
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
