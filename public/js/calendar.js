// 캘린더 기능

let currentDate = new Date();
let selectedDate = new Date();

function renderCalendar() {
    const calendarMobile = document.getElementById('calendar');
    const calendarDesktop = document.getElementById('calendarDesktop');

    // 모바일과 데스크톱 둘 다 같은 내용으로 렌더링
    [calendarMobile, calendarDesktop].forEach(calendarDiv => {
        if (!calendarDiv) return;

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // 헤더 (월/연도 및 네비게이션)
        const header = document.createElement('div');
        header.className = 'flex justify-between items-center mb-3 gap-2';
        header.innerHTML = `
            <button class="prevMonth px-2 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg font-semibold flex items-center justify-center flex-shrink-0">
                ◀️
            </button>
            <h3 class="text-base sm:text-lg font-bold text-gray-800 text-center flex-1">
                📅 ${year}년 ${month + 1}월
            </h3>
            <button class="nextMonth px-2 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg font-semibold flex items-center justify-center flex-shrink-0">
                ▶️
            </button>
        `;

        // 요일 표시
        const daysHeader = document.createElement('div');
        daysHeader.className = 'grid grid-cols-7 gap-0.5 mb-2';
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        dayNames.forEach(day => {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'text-center font-semibold text-gray-600 py-1 text-xs sm:text-sm';
            dayDiv.textContent = day;
            daysHeader.appendChild(dayDiv);
        });

        // 날짜 생성
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const daysGrid = document.createElement('div');
        daysGrid.className = 'grid grid-cols-7 gap-0.5';

        // 이전 달의 날짜들 (회색) — 점 자리를 비워둬서 현재 달과 세로 정렬 맞춤
        for (let i = firstDay - 1; i >= 0; i--) {
            const dayDiv = document.createElement('button');
            dayDiv.className = 'aspect-square p-0 text-gray-400 text-xs sm:text-sm rounded flex flex-col items-center justify-center leading-none';
            dayDiv.innerHTML = `<span>${daysInPrevMonth - i}</span><span class="w-1 h-1 mt-0.5"></span>`;
            dayDiv.disabled = true;
            daysGrid.appendChild(dayDiv);
        }

        // 현재 달의 날짜들
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = document.createElement('button');
            const dateObj = new Date(year, month, day);
            const isToday = isDateToday(dateObj);
            const isSelected = isDateEqual(dateObj, selectedDate);
            const todoStatus = todoStatusOnDate(dateObj);

            let classes = 'aspect-square p-0 text-xs sm:text-sm font-semibold rounded transition flex flex-col items-center justify-center leading-none';

            if (isSelected) {
                classes += ' bg-indigo-600 text-white ring-2 ring-indigo-400';
            } else if (isToday) {
                classes += ' bg-blue-100 text-indigo-600 border-2 border-indigo-600';
            } else {
                classes += ' bg-gray-100 text-gray-800 hover:bg-gray-200';
            }

            // 작업 있는 날짜 표시: 진행중 있으면 인디고 점, 전부 완료면 초록 점
            let dotClass = 'bg-transparent';
            if (todoStatus) {
                dotClass = isSelected ? 'bg-white' : (todoStatus === 'done' ? 'bg-green-500' : 'bg-indigo-500');
            }

            dayDiv.className = classes;
            dayDiv.innerHTML = `<span>${day}</span><span class="w-1 h-1 rounded-full mt-0.5 ${dotClass}"></span>`;

            dayDiv.addEventListener('click', () => {
                selectedDate = dateObj;
                updateSelectedDate();
                renderCalendar();
                renderTodos();
            });

            daysGrid.appendChild(dayDiv);
        }

        // 다음 달의 날짜들 (회색)
        const totalCells = daysGrid.children.length;
        const remainingCells = 42 - totalCells; // 6주 * 7일
        for (let day = 1; day <= remainingCells; day++) {
            const dayDiv = document.createElement('button');
            dayDiv.className = 'aspect-square p-0 text-gray-400 text-xs sm:text-sm rounded flex flex-col items-center justify-center leading-none';
            dayDiv.innerHTML = `<span>${day}</span><span class="w-1 h-1 mt-0.5"></span>`;
            dayDiv.disabled = true;
            daysGrid.appendChild(dayDiv);
        }

        // 점 색상 범례
        const legend = document.createElement('div');
        legend.className = 'flex items-center justify-center gap-4 mt-3 pt-3 border-t text-xs text-gray-500';
        legend.innerHTML = `
            <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>진행중</span>
            <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>완료</span>
        `;

        // 캘린더 렌더링
        calendarDiv.innerHTML = '';
        calendarDiv.appendChild(header);
        calendarDiv.appendChild(daysHeader);
        calendarDiv.appendChild(daysGrid);
        calendarDiv.appendChild(legend);
    });

    // 현재 보고 있는 달의 요약 카드도 함께 갱신
    renderSummary();
}

// 캘린더에 보이는 달(currentDate 기준) 기준으로 일정 요약 집계
function renderSummary() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    const monthTodos = todos.filter(t => t.date && t.date.startsWith(monthPrefix));
    const total = monthTodos.length;
    const done = monthTodos.filter(t => t.completed).length;
    const pending = total - done;
    const ratio = total ? Math.round((done / total) * 100) : 0;

    const body = total === 0
        ? `<p class="text-sm text-gray-400 text-center py-2">이번 달 등록된 일정이 없어요</p>`
        : `
            <div class="space-y-2 text-sm">
                <div class="flex justify-between"><span class="text-gray-500">전체 일정</span><span class="font-semibold text-gray-800">${total}</span></div>
                <div class="flex justify-between"><span class="text-gray-500">완료</span><span class="font-semibold text-green-600">${done}</span></div>
                <div class="flex justify-between"><span class="text-gray-500">진행중</span><span class="font-semibold text-indigo-600">${pending}</span></div>
            </div>
            <div class="mt-4">
                <div class="flex justify-between items-center mb-1 text-xs text-gray-500">
                    <span>완료율</span><span class="font-semibold">${ratio}%</span>
                </div>
                <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div class="h-full bg-green-500 rounded-full transition-all duration-500" style="width: ${ratio}%"></div>
                </div>
            </div>
        `;

    const html = `
        <div class="bg-white rounded-lg shadow-lg p-5">
            <h3 class="text-sm font-bold text-gray-700 mb-4">📊 ${year}년 ${month + 1}월 요약</h3>
            ${body}
        </div>
    `;

    ['summaryMobile', 'summaryDesktop'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    });
}

function isDateToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
}

function isDateEqual(date1, date2) {
    return date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear();
}

// 로컬 시간 기준 YYYY-MM-DD (toISOString의 UTC 변환으로 인한 하루 밀림 방지)
function formatDateLocal(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// 해당 날짜의 작업 상태: null(없음) / 'pending'(진행중 있음) / 'done'(전부 완료)
function todoStatusOnDate(date) {
    const dateStr = formatDateLocal(date);
    const dayTodos = todos.filter(todo => todo.date === dateStr);
    if (dayTodos.length === 0) return null;
    return dayTodos.every(t => t.completed) ? 'done' : 'pending';
}

function updateSelectedDate() {
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const dateStr = selectedDate.toLocaleDateString('ko-KR', options);
    document.getElementById('selectedDate').textContent = `${dateStr} 일정`;
}

// 네비게이션 이벤트 위임 (한 번만 등록)
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('prevMonth')) {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    } else if (e.target.classList.contains('nextMonth')) {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    }
});

// 페이지 로드 시 캘린더 렌더링
document.addEventListener('DOMContentLoaded', () => {
    updateSelectedDate();
    renderCalendar();
});
