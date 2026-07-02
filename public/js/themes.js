// 테마 관리

let currentTheme = localStorage.getItem('currentTheme') || 'default';

// 페이지 로드 시 저장된 테마 적용
function applyTheme(theme) {
    document.body.classList.remove('theme-default', 'theme-mario');
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('currentTheme', theme);
    currentTheme = theme;

    // 섹션 표시/숨김 (포트폴리오 페이지에서만)
    const profileSection = document.getElementById('profileSection');
    const tetrisSection = document.getElementById('tetrisSection');

    if (profileSection && tetrisSection) {
        // 테트리스 테마: 게임 + 기본 프로필 둘 다 표시 (게임이 위, 프로필이 아래)
        // 기본 테마: 게임만 숨김
        if (theme === 'mario') {
            tetrisSection.classList.remove('hidden');
        } else {
            tetrisSection.classList.add('hidden');
        }
        // 프로필은 두 테마 모두에서 항상 표시
        profileSection.classList.remove('hidden');
    }
}

// 테마 모달 관리
function setupThemeModal() {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeModal = document.getElementById('themeModal');
    const closeThemeModal = document.getElementById('closeThemeModal');
    const themeOptions = document.querySelectorAll('.themeOption');

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            themeModal.classList.remove('hidden');
        });
    }

    if (closeThemeModal) {
        closeThemeModal.addEventListener('click', () => {
            themeModal.classList.add('hidden');
        });
    }

    themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const theme = option.dataset.theme;
            applyTheme(theme);

            // 선택된 버튼 표시
            themeOptions.forEach(btn => {
                btn.classList.remove('border-indigo-300', 'bg-indigo-50', 'border-gray-300', 'bg-gray-50');
                btn.classList.add('border-gray-300', 'bg-gray-50');
            });
            option.classList.remove('border-gray-300', 'bg-gray-50');
            option.classList.add('border-indigo-300', 'bg-indigo-50');

            themeModal.classList.add('hidden');
        });
    });

    // 모달 외부 클릭 시 닫기
    themeModal.addEventListener('click', (e) => {
        if (e.target === themeModal) {
            themeModal.classList.add('hidden');
        }
    });
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    applyTheme(currentTheme);
    setupThemeModal();
});
