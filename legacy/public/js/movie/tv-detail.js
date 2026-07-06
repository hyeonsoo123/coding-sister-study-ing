// ============================================================
//  tv-detail.html 컨트롤러 (다국어 지원)
//  방영등급 · 시즌/화수 · 제공처 · 줄거리/키워드 · 예고편 ·
//  출연진(인물 링크) · 추천/비슷한 시리즈 · 리뷰 · 스틸컷
// ============================================================
(() => {
    const T = I18N.t;
    const root = document.getElementById('detailRoot');

    function getId() {
        const id = new URLSearchParams(location.search).get('id');
        return id && /^\d+$/.test(id) ? id : null;
    }

    const STATUS_KEY = {
        'Returning Series': 'st_returning',
        Ended: 'st_ended',
        Canceled: 'st_canceled',
        'In Production': 'st_production',
        Planned: 'st_planned',
        Pilot: 'st_pilot',
    };

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

    function certBadgeHtml(show) {
        const kr = (show.content_ratings?.results || []).find((r) => r.iso_3166_1 === 'KR');
        const badge = UI.certLabel(kr?.rating);
        return badge ? `<span class="px-3 py-1 ${badge.cls} rounded-full font-bold">${badge.text}</span>` : '';
    }

    function keywordsHtml(show) {
        const kws = (show.keywords?.results || []).slice(0, 12);
        if (!kws.length) return '';
        return `<div class="flex flex-wrap gap-2 mt-3">
            ${kws
                .map((k) => `<span class="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-xs"># ${UI.escapeHtml(k.name)}</span>`)
                .join('')}
        </div>`;
    }

    function providersHtml(show) {
        const kr = show['watch/providers']?.results?.KR;
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

    function reviewsHtml(show) {
        const list = (show.reviews?.results || []).slice(0, 3);
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

    function stillsHtml(show) {
        const stills = (show.images?.backdrops || []).slice(0, 10);
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

    function mediaRowHtml(id, title) {
        return `
            <section class="mb-8">
                <h3 class="text-xl font-bold text-gray-800 mb-3">${title}</h3>
                <div id="${id}" class="flex gap-3 overflow-x-auto pb-2 row-scroll"></div>
            </section>`;
    }

    function render(show) {
        const genres = (show.genres || []).map((g) => g.name);
        const trailer = pickTrailer(show.videos);
        const cast = (show.aggregate_credits?.cast || []).slice(0, 20);
        const recommendations = (show.recommendations?.results || []).filter((m) => m.poster_path).slice(0, 15);
        const similar = (show.similar?.results || []).filter((m) => m.poster_path).slice(0, 15);
        const runtime = Array.isArray(show.episode_run_time) ? show.episode_run_time[0] : show.episode_run_time;
        const networks = (show.networks || []).map((n) => n.name).filter(Boolean);
        const creators = (show.created_by || []).map((c) => c.name).filter(Boolean);
        const statusLabel = STATUS_KEY[show.status] ? T(STATUS_KEY[show.status]) : show.status;
        const isFav = Favorites.has(show.id, 'tv');

        root.innerHTML = `
            <div class="relative rounded-2xl overflow-hidden mb-8 shadow-lg">
                <div class="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
                    ${show.backdrop_path ? `<img src="${UI.img(show.backdrop_path, 'w1280')}" alt="" class="w-full h-full object-cover">` : ''}
                    <div class="absolute inset-0 bg-gradient-to-t from-[#0f1015] via-[#0f1015]/85 to-[#0f1015]/25"></div>
                </div>
                <div class="relative flex flex-col sm:flex-row gap-6 p-6 sm:p-8">
                    <img src="${UI.img(show.poster_path)}" alt="${UI.escapeHtml(show.name)}"
                         class="w-40 sm:w-56 rounded-xl shadow-lg shrink-0 mx-auto sm:mx-0">
                    <div class="flex-1 min-w-0">
                        <h2 class="text-2xl sm:text-4xl font-bold text-gray-900">
                            ${UI.escapeHtml(show.name)}
                            <span class="text-gray-400 font-medium text-xl">${UI.year(show.first_air_date)}</span>
                            <span class="align-middle ml-1 px-2 py-0.5 bg-indigo-600 text-white text-xs font-extrabold rounded">TV</span>
                        </h2>
                        ${show.original_name && show.original_name !== show.name ? `<p class="text-gray-400 text-sm mt-1">${UI.escapeHtml(show.original_name)}</p>` : ''}
                        ${show.tagline ? `<p class="text-indigo-600 font-semibold mt-1 italic">${UI.escapeHtml(show.tagline)}</p>` : ''}
                        <div class="flex flex-wrap items-center gap-2 mt-4 text-sm">
                            <span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-bold">⭐ ${UI.rating(show.vote_average)}</span>
                            ${certBadgeHtml(show)}
                            ${show.number_of_seasons ? `<span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">📚 ${T('seasons', { s: show.number_of_seasons, e: show.number_of_episodes || '?' })}</span>` : ''}
                            ${runtime ? `<span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">⏱ ${T('per_ep', { t: runtimeText(runtime) })}</span>` : ''}
                            ${statusLabel ? `<span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">${UI.escapeHtml(statusLabel)}</span>` : ''}
                        </div>
                        <div class="flex flex-wrap gap-2 mt-3">
                            ${genres.map((g) => `<span class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">${UI.escapeHtml(g)}</span>`).join('')}
                        </div>
                        ${networks.length ? `<p class="text-sm text-gray-500 mt-3">📡 ${T('ch_label')}: ${UI.escapeHtml(networks.join(', '))}</p>` : ''}
                        ${creators.length ? `<p class="text-sm text-gray-500 mt-1">✍️ ${T('creator_label')}: ${UI.escapeHtml(creators.join(', '))}</p>` : ''}
                        <button id="favToggle" type="button"
                            class="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-lg font-bold min-h-[44px] transition
                                   ${isFav ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-gray-800 border-2 border-gray-300 hover:border-red-400'}">
                            <span id="favIcon">${isFav ? '❤️' : '🤍'}</span>
                            <span id="favLabel">${isFav ? T('fav_done') : T('fav_do')}</span>
                        </button>
                    </div>
                </div>
            </div>

            ${providersHtml(show)}

            ${
                show.overview
                    ? `<section class="mb-8">
                        <h3 class="text-xl font-bold text-gray-800 mb-2">📖 ${T('sec_overview')}</h3>
                        <p class="text-gray-700 leading-relaxed">${UI.escapeHtml(show.overview)}</p>
                        ${keywordsHtml(show)}
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
                                .map((p) => {
                                    const character = p.roles?.[0]?.character || '';
                                    return `
                                <a href="person.html?id=${p.id}" class="shrink-0 w-24 text-center group">
                                    <img src="${UI.profileImg(p.profile_path, 'w185')}" alt="${UI.escapeHtml(p.name)}"
                                         loading="lazy" class="w-24 h-24 rounded-full object-cover mx-auto shadow group-hover:ring-2 group-hover:ring-indigo-400 transition">
                                    <p class="text-sm font-semibold text-gray-800 mt-2 leading-tight group-hover:text-indigo-600">${UI.escapeHtml(p.name)}</p>
                                    <p class="text-xs text-gray-500 leading-tight">${UI.escapeHtml(character)}</p>
                                </a>`;
                                })
                                .join('')}
                        </div>
                       </section>`
                    : ''
            }

            ${recommendations.length ? mediaRowHtml('recommendRow', '👍 ' + T('sec_rec_tv')) : ''}
            ${similar.length ? mediaRowHtml('similarRow', '🎞 ' + T('sec_sim_tv')) : ''}
            ${reviewsHtml(show)}
            ${stillsHtml(show)}
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
            const added = Favorites.toggle(show, 'tv');
            document.getElementById('favIcon').textContent = added ? '❤️' : '🤍';
            document.getElementById('favLabel').textContent = added ? T('fav_done') : T('fav_do');
            favBtn.className =
                'mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-lg font-bold min-h-[44px] transition ' +
                (added ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-gray-800 border-2 border-gray-300 hover:border-red-400');
            UI.toast(added ? T('toast_added') : T('toast_removed'));
        });

        document.title = `${show.name} · Coding Sister`;
        Recent.add(show, 'tv');
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
            const show = await TMDBApi.tvDetail(id);
            if (!show.reviews?.results?.length) {
                try {
                    show.reviews = await TMDBApi.tvReviews(id);
                } catch { /* 리뷰 실패는 무시 */ }
            }
            render(show);
            window.scrollTo({ top: 0 });
        } catch (err) {
            renderError(`${T('err_load_tv')} (${err.message})`);
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
