// ============================================================
//  person.html 컨트롤러
//  ?id=123 인물(배우/감독) 프로필 + 약력 + 필모그래피
// ============================================================
(() => {
    const T = I18N.t;
    const root = document.getElementById('personRoot');

    function getId() {
        const id = new URLSearchParams(location.search).get('id');
        return id && /^\d+$/.test(id) ? id : null;
    }

    const DEPT_KEY = {
        Acting: 'dept_acting',
        Directing: 'dept_directing',
        Writing: 'dept_writing',
        Production: 'dept_production',
        Sound: 'dept_sound',
        Camera: 'dept_camera',
    };

    function ageText(birthday, deathday) {
        if (!birthday) return '';
        const born = birthday;
        if (deathday) return `${born} ~ ${deathday}`;
        return born;
    }

    // 출연작 정리(영화+TV 통합): 포스터 있는 것만, 중복 제거, 최신순
    function filmography(person) {
        const seen = new Set();
        const dateOf = (m) => m.release_date || m.first_air_date || '';
        return (person.combined_credits?.cast || [])
            .filter((m) => {
                const key = `${m.media_type}:${m.id}`;
                return m.poster_path && !seen.has(key) && seen.add(key);
            })
            .sort((a, b) => dateOf(b).localeCompare(dateOf(a)));
    }

    function render(person) {
        const dept = DEPT_KEY[person.known_for_department]
            ? T(DEPT_KEY[person.known_for_department])
            : person.known_for_department || '';
        const films = filmography(person);
        const bio = (person.biography || '').trim();
        const bioLong = bio.length > 400;

        root.innerHTML = `
            <div class="flex flex-col sm:flex-row gap-6 mb-8">
                <img src="${UI.profileImg(person.profile_path, 'w342')}" alt="${UI.escapeHtml(person.name)}"
                     class="w-40 sm:w-56 rounded-xl shadow-lg shrink-0 mx-auto sm:mx-0">
                <div class="flex-1 min-w-0">
                    <h2 class="text-2xl sm:text-4xl font-bold text-gray-900">${UI.escapeHtml(person.name)}</h2>
                    ${dept ? `<p class="text-indigo-600 font-semibold mt-1">${UI.escapeHtml(dept)}</p>` : ''}
                    <div class="flex flex-wrap gap-3 mt-4 text-sm text-gray-600">
                        ${person.birthday ? `<span class="px-3 py-1 bg-gray-100 rounded-full">🎂 ${ageText(person.birthday, person.deathday)}</span>` : ''}
                        ${person.place_of_birth ? `<span class="px-3 py-1 bg-gray-100 rounded-full">📍 ${UI.escapeHtml(person.place_of_birth)}</span>` : ''}
                        <span class="px-3 py-1 bg-gray-100 rounded-full">🎬 ${T('p_films', { n: films.length })}</span>
                    </div>
                    ${
                        bio
                            ? `<div class="mt-4">
                                <p class="bio-body text-gray-700 text-sm leading-relaxed whitespace-pre-line ${bioLong ? 'clamped' : ''}">${UI.escapeHtml(bio)}</p>
                                ${bioLong ? `<button type="button" id="bioMore" class="text-indigo-600 text-sm font-semibold mt-1">${T('more_btn')}</button>` : ''}
                               </div>`
                            : `<p class="mt-4 text-gray-400 text-sm">${T('p_no_bio')}</p>`
                    }
                </div>
            </div>

            ${
                films.length
                    ? `<section class="mb-8">
                        <h3 class="text-xl font-bold text-gray-800 mb-3">🎞 ${T('p_filmo')}</h3>
                        <div id="filmoGrid" class="movie-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"></div>
                       </section>`
                    : `<p class="text-gray-400 text-center py-10">${T('p_no_films')}</p>`
            }
        `;

        const grid = document.getElementById('filmoGrid');
        if (grid) films.forEach((m) => grid.appendChild(UI.movieCard(m)));

        const bioMore = document.getElementById('bioMore');
        if (bioMore) {
            bioMore.addEventListener('click', () => {
                const body = root.querySelector('.bio-body');
                const clamped = body.classList.toggle('clamped');
                bioMore.textContent = clamped ? T('more_btn') : T('less_btn');
            });
        }

        document.title = `${person.name} · Coding Sister`;
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
            const person = await TMDBApi.person(id);
            render(person);
            window.scrollTo({ top: 0 });
        } catch (err) {
            renderError(`${T('err_load_person')} (${err.message})`);
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
