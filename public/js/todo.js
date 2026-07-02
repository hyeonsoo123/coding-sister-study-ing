// TODO 상태 관리 (Firebase Realtime Database 버전)
//
// 흐름: 쓰기(추가/토글/삭제)는 DB에만 반영하고, 화면 갱신은 하지 않는다.
// DB가 바뀌면 firebase.js의 구독(onValue)이 todos를 갱신하고 렌더링을 다시 호출한다.
// → 다른 브라우저/기기에서 바꿔도 새로고침 없이 실시간 반영된다.

let todos = [];
let currentFilter = 'all';
let todosLoaded = false; // 첫 스냅샷 수신 여부 (로딩 표시용)
let editingId = null; // 현재 인라인 편집 중인 일정 id (없으면 null)
const expandedIds = new Set(); // 상세 설명이 펼쳐진 작업 id (재렌더링돼도 유지)

// 사용자 입력을 HTML에 넣기 전에 이스케이프 (XSS 방지)
function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

// "2026. 7. 2. 오후 3:00:00" → "7. 2. 오후 3:00" (연도·초 생략, 표시용)
function formatTimeShort(str) {
    return String(str)
        .replace(/^\d{4}\.\s*/, '')
        .replace(/((오전|오후)\s\d{1,2}:\d{2}):\d{2}/, '$1');
}

// TODO 추가 함수
function addTodo(title, description = '') {
    const todoInput = document.getElementById('todoInput');

    if (!title.trim()) {
        // alert 대신 입력창 자체에 오류 표시
        todoInput.classList.add('border-red-400', 'ring-2', 'ring-red-300');
        todoInput.placeholder = '⚠️ 일정 제목을 입력해주세요';
        todoInput.focus();
        return;
    }

    todoDB.add({
        title: title.trim(),
        description: description.trim(),
        completed: false,
        date: formatDateLocal(selectedDate),
        createdAt: new Date().toLocaleString('ko-KR'),
        completedAt: null
    });

    // 입력 필드 비우고 다시 포커스 (연속 입력 편하게)
    todoInput.value = '';
    document.getElementById('todoDescription').value = '';
    todoInput.focus();

    // "완료" 필터를 보던 중이면, 방금 추가한 작업이 보이도록 전체로 전환
    if (currentFilter === 'completed') setFilter('all');
}

// TODO 제거 함수
function deleteTodo(id) {
    if (confirm('정말 삭제하시겠습니까?')) {
        todoDB.remove(id);
    }
}

// 편집 모드 진입 — 해당 카드를 입력 폼으로 전환
function startEdit(id) {
    const todo = todos.find(t => t.id === id);
    if (todo && todo.completed) return; // 완료된 일정은 수정 잠금 (완료 취소 후 가능)
    editingId = id;
    expandedIds.add(id); // 설명도 함께 편집할 수 있게 펼침
    renderTodos();
    // 렌더 후 제목 입력창에 포커스 + 커서를 끝으로
    const input = document.getElementById('editTitleInput');
    if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
    }
}

// 편집 취소
function cancelEdit() {
    editingId = null;
    renderTodos();
}

// 편집 내용 저장
function saveEdit(id) {
    const titleInput = document.getElementById('editTitleInput');
    const descInput = document.getElementById('editDescInput');
    const title = titleInput.value.trim();
    const description = descInput.value.trim();

    if (!title) {
        titleInput.classList.add('border-red-400', 'ring-2', 'ring-red-300');
        titleInput.focus();
        return;
    }

    const todo = todos.find(t => t.id === id);
    const changed = todo && (todo.title !== title || (todo.description || '') !== description);

    if (changed) {
        // 바뀐 경우에만: 옛 버전을 이력으로 남기고 현재 값을 갱신
        todoDB.pushHistory(id, {
            title: todo.title,
            description: todo.description || '',
            editedAt: new Date().toLocaleString('ko-KR')
        });
        todoDB.update(id, {
            title: title,
            description: description,
            updatedAt: new Date().toLocaleString('ko-KR')
        });
    }
    editingId = null;
    renderTodos(); // 변경 없이 취소된 경우에도 폼을 닫아줌
    // (변경된 경우 DB 구독 콜백이 한 번 더 렌더링)
}

// TODO 완료 토글 함수
function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        const completed = !todo.completed;
        todoDB.update(id, {
            completed: completed,
            completedAt: completed ? new Date().toLocaleString('ko-KR') : null
        });
    }
}

// 필터 전환 (버튼 스타일 갱신 + 목록 다시 그리기)
function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filterBtn').forEach(btn => {
        const active = btn.dataset.filter === filter;
        btn.classList.toggle('bg-indigo-600', active);
        btn.classList.toggle('text-white', active);
        btn.classList.toggle('bg-gray-200', !active);
        btn.classList.toggle('text-gray-700', !active);
    });
    renderTodos();
}

// TODO 렌더링 함수
function renderTodos() {
    const todoList = document.getElementById('todoList');
    todoList.innerHTML = '';

    // 첫 데이터가 오기 전에는 로딩 표시
    if (!todosLoaded) {
        todoList.innerHTML = '<p class="text-center text-gray-500 py-8">⏳ 불러오는 중...</p>';
        return;
    }

    // 선택한 날짜의 TODO만 필터링
    const selectedDateStr = formatDateLocal(selectedDate);
    const todosForDate = todos.filter(todo => todo.date === selectedDateStr);

    // 필터 버튼에 개수 표시 — "전체 3 / 진행중 2 / 완료 1"
    const counts = {
        all: todosForDate.length,
        active: todosForDate.filter(t => !t.completed).length,
        completed: todosForDate.filter(t => t.completed).length
    };
    const filterLabels = { all: '전체', active: '진행중', completed: '완료' };
    document.querySelectorAll('.filterBtn').forEach(btn => {
        const f = btn.dataset.filter;
        btn.textContent = counts[f] > 0 ? `${filterLabels[f]} ${counts[f]}` : filterLabels[f];
    });

    // 추가 필터링 (전체/진행중/완료)
    const filteredTodos = todosForDate.filter(todo => {
        if (currentFilter === 'active') return !todo.completed;
        if (currentFilter === 'completed') return todo.completed;
        return true;
    });

    // 완료 안 된 작업이 위로 (같은 그룹 안에서는 최신순 유지)
    filteredTodos.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        return 0;
    });

    if (filteredTodos.length === 0) {
        // 상황별 안내 문구 (지금 보고 있는 필터가 뭘 하는지 스스로 설명하도록)
        let message = '이 날짜에 일정이 없습니다.<br>위 입력창에서 첫 일정을 등록해보세요 ✍️';
        if (currentFilter === 'active' && counts.all > 0) {
            message = '진행중인 일정이 없어요. 전부 완료! 🎉';
        } else if (currentFilter === 'completed' && counts.all > 0) {
            message = '아직 완료한 일정이 없어요.<br>일정의 스케줄 완료 버튼을 눌러보세요';
        }
        todoList.innerHTML = `<p class="text-center text-gray-500 py-8 leading-relaxed">${message}</p>`;
        return;
    }

    filteredTodos.forEach(todo => {
        const hasDesc = !!todo.description;
        // history는 push 객체 형태 → 최신 수정이 위로 오도록 뒤집는다
        const history = todo.history ? Object.values(todo.history).reverse() : [];
        const hasHistory = history.length > 0;
        const hasExtra = hasDesc || hasHistory; // 설명이나 이력이 있으면 펼침 가능
        const isExpanded = expandedIds.has(todo.id);

        const todoItem = document.createElement('div');
        // 편집 모드: 이 카드를 입력 폼으로 렌더링
        if (todo.id === editingId) {
            todoItem.className = 'p-4 rounded-xl border-2 border-indigo-300 bg-white shadow-sm';
            todoItem.innerHTML = `
                <input
                    type="text"
                    id="editTitleInput"
                    value="${escapeHtml(todo.title)}"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base font-semibold min-h-[44px]"
                    placeholder="일정 제목"
                >
                <textarea
                    id="editDescInput"
                    class="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm min-h-[80px] resize-none"
                    placeholder="상세 설명 (선택)"
                >${escapeHtml(todo.description || '')}</textarea>
                <div class="flex justify-end gap-2 mt-3">
                    <button
                        class="todoSaveBtn px-4 py-2 rounded-lg transition font-semibold text-sm min-h-[44px] bg-indigo-600 text-white hover:bg-indigo-700"
                        data-todo-id="${todo.id}"
                    >
                        저장
                    </button>
                    <button
                        class="todoCancelBtn px-4 py-2 rounded-lg transition font-semibold text-sm min-h-[44px] bg-gray-100 text-gray-500 hover:bg-gray-200"
                    >
                        취소
                    </button>
                </div>
            `;
            todoList.appendChild(todoItem);
            return; // 이 카드는 폼으로 끝
        }

        todoItem.className = `p-4 rounded-xl border transition ${
            todo.completed
                ? 'bg-gray-50 border-gray-200 opacity-70'
                : 'bg-white border-gray-200 hover:border-indigo-200 hover:shadow-sm'
        }`;

        todoItem.innerHTML = `
            <div class="${hasExtra ? 'todoExpandBtn cursor-pointer' : ''}" ${hasExtra ? `data-todo-id="${todo.id}" title="${isExpanded ? '접기' : '펼치기'}"` : ''}>
                <div class="flex items-center justify-between gap-3">
                    <p class="flex-1 min-w-0 text-base sm:text-lg font-semibold text-gray-800 ${todo.completed ? 'line-through text-gray-400' : ''} break-words">
                        ${escapeHtml(todo.title)}
                    </p>
                    ${hasExtra ? `<span class="shrink-0 text-gray-400 text-xs transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}">▼</span>` : ''}
                </div>
                <div class="flex flex-wrap items-center gap-x-2 mt-1 text-xs text-gray-400">
                    <span>${formatTimeShort(todo.createdAt)} 등록</span>
                    ${todo.updatedAt ? `<span class="text-indigo-500">· ${formatTimeShort(todo.updatedAt)} 수정</span>` : ''}
                    ${todo.completedAt ? `<span class="text-green-600 font-medium">· ${formatTimeShort(todo.completedAt)} 완료</span>` : ''}
                </div>
            </div>

            ${isExpanded ? `
                ${hasDesc ? `<p class="mt-3 text-sm text-gray-600 break-words whitespace-pre-line bg-gray-50 rounded-lg p-3">${escapeHtml(todo.description)}</p>` : ''}
                ${hasHistory ? `
                    <div class="mt-3 border-t border-dashed border-gray-200 pt-3">
                        <p class="text-xs font-semibold text-gray-500 mb-2">📝 수정 이력 ${history.length}개</p>
                        <ul class="space-y-2">
                            ${history.map(h => `
                                <li class="text-xs text-gray-400 bg-gray-50 rounded-lg p-2">
                                    <span class="text-gray-500">${formatTimeShort(h.editedAt)} 이전</span>
                                    <p class="text-gray-600 mt-0.5 break-words">${escapeHtml(h.title)}</p>
                                    ${h.description ? `<p class="text-gray-400 mt-0.5 break-words whitespace-pre-line">${escapeHtml(h.description)}</p>` : ''}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            ` : ''}

            <div class="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                    class="todoToggleBtn px-4 py-2 rounded-lg transition font-semibold text-sm min-h-[44px] ${
                        todo.completed
                            ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                    }"
                    data-todo-id="${todo.id}"
                >
                    ${todo.completed ? '완료 취소' : '스케줄 완료'}
                </button>
                ${todo.completed ? '' : `
                <button
                    class="todoEditBtn px-4 py-2 rounded-lg transition font-semibold text-sm min-h-[44px] bg-gray-100 text-gray-500 hover:bg-gray-200"
                    data-todo-id="${todo.id}"
                >
                    수정
                </button>`}
                <button
                    class="todoDeleteBtn px-4 py-2 rounded-lg transition font-semibold text-sm min-h-[44px] bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600"
                    data-todo-id="${todo.id}"
                >
                    삭제
                </button>
            </div>
        `;

        todoList.appendChild(todoItem);
    });

    // 진행률 표시 (선택한 날짜 전체 기준 — 필터와 무관하게 일관된 수치)
    const stats = document.createElement('div');
    stats.className = 'mt-6 pt-4 border-t text-sm text-gray-600';
    const doneRatio = Math.round((counts.completed / counts.all) * 100);
    stats.innerHTML = `
        <div class="flex justify-between items-center mb-2">
            <span>진행률</span>
            <span><strong>${counts.completed}</strong> / ${counts.all} 완료 · ${doneRatio}%</span>
        </div>
        <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div class="h-full bg-green-500 rounded-full transition-all duration-500" style="width: ${doneRatio}%"></div>
        </div>
    `;
    todoList.appendChild(stats);
}

// 기존 localStorage 데이터를 DB로 1회 이관 (DB가 비어있을 때만)
function migrateLocalTodos() {
    const saved = JSON.parse(localStorage.getItem('todos') || '[]');
    if (saved.length === 0) return;

    saved.forEach(({ id, ...todo }) => todoDB.add(todo)); // 숫자 id는 버리고 push 키 사용
    localStorage.removeItem('todos');
    console.log(`localStorage의 TODO ${saved.length}개를 Firebase로 이관했습니다.`);
}

// 이벤트 리스너 설정
function setupTodoListeners() {
    const addTodoBtn = document.getElementById('addTodoBtn');
    const todoInput = document.getElementById('todoInput');

    addTodoBtn.addEventListener('click', () => {
        const title = todoInput.value;
        const description = document.getElementById('todoDescription').value;
        addTodo(title, description);
    });

    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            const title = todoInput.value;
            const description = document.getElementById('todoDescription').value;
            addTodo(title, description);
        }
    });

    // 제목을 입력하기 시작하면 오류 표시 해제
    todoInput.addEventListener('input', () => {
        todoInput.classList.remove('border-red-400', 'ring-2', 'ring-red-300');
        todoInput.placeholder = '일정 제목을 입력하세요...';
    });

    // 필터 버튼 이벤트
    document.querySelectorAll('.filterBtn').forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });
}

// TODO 이벤트 위임 — closest()로 버튼 안쪽 요소를 클릭해도 동작하게
document.addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('.todoToggleBtn');
    const editBtn = e.target.closest('.todoEditBtn');
    const saveBtn = e.target.closest('.todoSaveBtn');
    const cancelBtn = e.target.closest('.todoCancelBtn');
    const deleteBtn = e.target.closest('.todoDeleteBtn');
    const expandArea = e.target.closest('.todoExpandBtn');

    if (toggleBtn) {
        toggleTodo(toggleBtn.dataset.todoId);
    } else if (editBtn) {
        startEdit(editBtn.dataset.todoId);
    } else if (saveBtn) {
        saveEdit(saveBtn.dataset.todoId);
    } else if (cancelBtn) {
        cancelEdit();
    } else if (deleteBtn) {
        deleteTodo(deleteBtn.dataset.todoId);
    } else if (expandArea) {
        // 상세 설명 아코디언 토글 (카드 헤더 어디를 눌러도 동작)
        const id = expandArea.dataset.todoId;
        expandedIds.has(id) ? expandedIds.delete(id) : expandedIds.add(id);
        renderTodos();
    }
});

// 편집 중 단축키: 제목칸에서 Enter=저장, 어디서든 Esc=취소
document.addEventListener('keydown', (e) => {
    if (editingId === null) return;
    if (e.key === 'Escape') {
        cancelEdit();
    } else if (e.key === 'Enter' && e.target.id === 'editTitleInput') {
        e.preventDefault();
        saveEdit(editingId);
    }
});

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    setupTodoListeners();

    // Firebase 설정이 안 된 경우 firebase.js가 안내 메시지를 표시하므로 여기서는 종료
    if (!window.todoDB) return;

    // DB 구독 시작 — 이후 모든 화면 갱신은 이 콜백에서 일어난다
    let firstSnapshot = true;
    todoDB.subscribe((list) => {
        todos = list;
        todosLoaded = true;

        if (firstSnapshot) {
            firstSnapshot = false;
            if (todos.length === 0) migrateLocalTodos(); // 기존 데이터 1회 이관
        }

        renderTodos();
        renderCalendar(); // 날짜별 작업 표시 갱신
    });
});
